import { SwiftShipDB } from './db.module.js';

/**
 * Fetches real-time dashboard statistics from the database.
 */
export async function getDashboardStats() {
  try {
    const shipments = await SwiftShipDB.listShipments();
    const users = await SwiftShipDB.db.users.toArray();
    
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const pending = shipments.filter(s => s.status !== 'delivered').length;
    
    return {
      totalShipments: total,
      activeUsers: users.length,
      pendingShipments: pending,
      deliveredShipments: delivered
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalShipments: 0,
      activeUsers: 0,
      pendingShipments: 0,
      deliveredShipments: 0
    };
  }
}

/**
 * Fetches the most recent shipment activity from the database.
 */
export async function getRecentActivity(limit = 3) {
  try {
    const shipments = await SwiftShipDB.listShipments();
    
    // Sort by last update time (updated_at) descending; fallback to created_at
    shipments.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || 0;
      const bTime = b.updated_at || b.created_at || 0;
      return bTime - aTime;
    });
    
    const recent = shipments.slice(0, limit);
    
    return recent.map(ship => {
      let icon = '📦';
      let actionText = 'created';
      
      if (ship.status === 'in_transit') {
        icon = '🚚';
        actionText = 'in transit';
      } else if (ship.status === 'delivered') {
        icon = '✅';
        actionText = 'delivered';
      }
      
      return {
        id: ship.shipment_code,
        icon,
        text: `${ship.shipment_code} ${actionText} — ${ship.source_city} → ${ship.destination_city}`,
        timestamp: ship.updated_at || ship.created_at
      };
    });
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    return [];
  }
}
