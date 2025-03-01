import { Request, Response } from "express";
import Order from "../models/order";
import Restaurant from "../models/restaurant";
import mongoose from "mongoose";

interface MenuItemSales {
  menuItemId: string;
  name: string;
  count: number;
  revenue: number;
}

interface TimeDistribution {
  hour: number;
  count: number;
  revenue: number;
}

interface DayDistribution {
  day: string;
  count: number;
  revenue: number;
}

interface SalesPerformanceReport {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  revenueByPeriod: {
    daily: { date: string; revenue: number }[];
    weekly: { week: string; revenue: number }[];
    monthly: { month: string; revenue: number }[];
  };
  popularItems: MenuItemSales[];
  peakTimes: {
    byHour: TimeDistribution[];
    byDay: DayDistribution[];
  };
}

const getSalesPerformance = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    // Validate if restaurant exists and belongs to the current user
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      user: req.userId,
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found or unauthorized" });
    }
    
    // Get query parameters
    const { startDate, endDate, period } = req.query;
    const periodType = (period as string) || 'daily'; // Default to daily
    
    // Parse dates or use defaults (last 30 days)
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get all paid orders for the restaurant within date range
    const orders = await Order.find({
      restaurant: restaurantId,
      status: "paid",
      createdAt: { $gte: start, $lte: end }
    });
    
    if (orders.length === 0) {
      return res.status(200).json({
        summary: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        revenueByPeriod: {
          daily: [],
          weekly: [],
          monthly: []
        },
        popularItems: [],
        peakTimes: {
          byHour: [],
          byDay: []
        }
      });
    }
    
    // Calculate summary metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0) / 100, 0);
    const averageOrderValue = totalRevenue / totalOrders;
    
    // Generate revenue by period (daily, weekly, monthly)
    const revenueByPeriod = generateRevenueByPeriod(orders, start, end, periodType);
    
    // Calculate most popular menu items
    const popularItems = calculatePopularItems(orders);
    
    // Calculate peak ordering times
    const peakTimes = calculatePeakTimes(orders);
    
    const report: SalesPerformanceReport = {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      },
      revenueByPeriod,
      popularItems,
      peakTimes
    };
    
    res.status(200).json(report);
  } catch (error) {
    console.error("Error generating sales performance report:", error);
    res.status(500).json({ message: "Error generating sales report" });
  }
};

// Helper function to generate revenue by period
const generateRevenueByPeriod = (orders: any[], start: Date, end: Date, periodType: string) => {
  // Create a map to store revenue by date
  const dailyRevenue = new Map<string, number>();
  const weeklyRevenue = new Map<string, number>();
  const monthlyRevenue = new Map<string, number>();
  
  // Initialize all dates in range with zero
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMilliseconds)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyRevenue.set(dateStr, 0);
    
    // For weekly
    const weekYear = getWeekYear(d);
    weeklyRevenue.set(weekYear, 0);
    
    // For monthly
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue.set(monthYear, 0);
  }
  
  // Aggregate order amounts by date
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const dateStr = orderDate.toISOString().split('T')[0];
    const amount = (order.totalAmount || 0) / 100; // Convert cents to dollars
    
    // Daily
    dailyRevenue.set(dateStr, (dailyRevenue.get(dateStr) || 0) + amount);
    
    // Weekly
    const weekYear = getWeekYear(orderDate);
    weeklyRevenue.set(weekYear, (weeklyRevenue.get(weekYear) || 0) + amount);
    
    // Monthly
    const monthYear = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue.set(monthYear, (monthlyRevenue.get(monthYear) || 0) + amount);
  });
  
  // Convert maps to arrays for output
  const daily = Array.from(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));
  const weekly = Array.from(weeklyRevenue).map(([week, revenue]) => ({ week, revenue }));
  const monthly = Array.from(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));
  
  return { daily, weekly, monthly };
};

// Helper function to get week number and year combined
const getWeekYear = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

// Helper function to calculate most popular menu items
const calculatePopularItems = (orders: any[]) => {
  const itemMap = new Map<string, MenuItemSales>();
  
  orders.forEach(order => {
    (order.cartItems || []).forEach((item: any) => {
      const menuItemId = item.menuItemId?.toString();
      if (!menuItemId) return;
      
      const quantity = parseInt(item.quantity) || 0;
      const itemName = item.name || "Unknown Item";
      
      // Find the price by searching all orders with this item
      const unitPrice = item.price || calculateAveragePrice(orders, menuItemId);
      const revenue = quantity * unitPrice;
      
      if (!itemMap.has(menuItemId)) {
        itemMap.set(menuItemId, { menuItemId, name: itemName, count: 0, revenue: 0 });
      }
      
      const currentStats = itemMap.get(menuItemId)!;
      itemMap.set(menuItemId, {
        ...currentStats,
        count: currentStats.count + quantity,
        revenue: currentStats.revenue + revenue
      });
    });
  });
  
  // Convert to array and sort by count (descending)
  return Array.from(itemMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 items
};

// Helper function to calculate average price for an item across orders
const calculateAveragePrice = (orders: any[], menuItemId: string) => {
  let totalPrice = 0;
  let count = 0;
  
  orders.forEach(order => {
    (order.cartItems || []).forEach((item: any) => {
      if (item.menuItemId?.toString() === menuItemId && item.price) {
        totalPrice += item.price;
        count++;
      }
    });
  });
  
  return count > 0 ? totalPrice / count : 0;
};

// Helper function to calculate peak ordering times
const calculatePeakTimes = (orders: any[]) => {
  const hourlyDistribution = new Array(24).fill(null).map((_, i) => ({
    hour: i,
    count: 0,
    revenue: 0
  }));
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyDistribution = daysOfWeek.map(day => ({
    day,
    count: 0,
    revenue: 0
  }));
  
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const hour = orderDate.getHours();
    const day = orderDate.getDay(); // 0 = Sunday, 6 = Saturday
    const amount = (order.totalAmount || 0) / 100;
    
    // Increment hour stats
    hourlyDistribution[hour].count++;
    hourlyDistribution[hour].revenue += amount;
    
    // Increment day stats
    dailyDistribution[day].count++;
    dailyDistribution[day].revenue += amount;
  });
  
  return {
    byHour: hourlyDistribution,
    byDay: dailyDistribution
  };
};

export default {
  getSalesPerformance
};