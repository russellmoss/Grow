/**
 * Utility to check CloudForge T5 entities for intensity/level controls
 * 
 * This can be run in the browser console after the dashboard loads:
 * 
 * import { checkCloudForgeEntities } from './utils/check-cloudforge-entities';
 * checkCloudForgeEntities();
 * 
 * Or use the MCP connection if available
 */

import { haWebSocket } from '../services/ha-websocket.js';

/**
 * Check all CloudForge T5 entities to find intensity/level controls
 */
export async function checkCloudForgeEntities() {
  try {
    console.log('🔍 Checking CloudForge T5 entities for intensity/level controls...\n');
    
    // Wait for connection
    if (!haWebSocket.connection) {
      console.log('⏳ Waiting for WebSocket connection...');
      await new Promise(resolve => {
        const checkConnection = setInterval(() => {
          if (haWebSocket.connection) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }
    
    // Get all states via WebSocket
    const message = {
      type: 'get_states',
      id: Date.now(),
    };
    
    // Use the connection's sendMessagePromise if available
    let states;
    if (typeof haWebSocket.connection.sendMessagePromise === 'function') {
      states = await haWebSocket.connection.sendMessagePromise(message);
    } else {
      // Fallback: try to get states another way
      console.warn('⚠️ sendMessagePromise not available, trying alternative method...');
      // We'll need to use the REST API as fallback
      const HA_URL = import.meta.env.VITE_HA_URL || 'http://100.65.202.84:8123';
      const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;
      
      const response = await fetch(`${HA_URL}/api/states`, {
        headers: {
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      states = await response.json();
    }
    
    // Filter for CloudForge T5 entities
    const cloudforgeEntities = states.filter(e => 
      e.entity_id && (
        e.entity_id.includes('cloudforge_t5') || 
        e.entity_id.includes('cloudforge_t')
      )
    );
    
    console.log(`Found ${cloudforgeEntities.length} CloudForge entities:\n`);
    
    // Group by type
    const byType = {
      number: [],
      select: [],
      sensor: [],
      binary_sensor: [],
      switch: [],
      other: [],
    };
    
    cloudforgeEntities.forEach(entity => {
      const type = entity.entity_id.split('.')[0];
      if (byType[type]) {
        byType[type].push(entity);
      } else {
        byType.other.push(entity);
      }
    });
    
    // Display number entities (these would be for intensity/level control)
    if (byType.number.length > 0) {
      console.log('✅ NUMBER ENTITIES FOUND (Intensity/Level Control Available!):');
      byType.number.forEach(entity => {
        console.log(`\n  📊 ${entity.entity_id}`);
        console.log(`     Friendly Name: ${entity.attributes?.friendly_name || 'N/A'}`);
        console.log(`     Current Value: ${entity.state}`);
        if (entity.attributes?.min !== undefined) {
          console.log(`     Range: ${entity.attributes.min} - ${entity.attributes.max}`);
        }
        if (entity.attributes?.step !== undefined) {
          console.log(`     Step: ${entity.attributes.step}`);
        }
        if (entity.attributes?.unit_of_measurement) {
          console.log(`     Unit: ${entity.attributes.unit_of_measurement}`);
        }
      });
      console.log('\n');
    } else {
      console.log('❌ No NUMBER entities found for CloudForge T5');
      console.log('   This means there is NO intensity/level control available\n');
    }
    
    // Display select entities
    if (byType.select.length > 0) {
      console.log('📋 SELECT ENTITIES (Mode/Option Control):');
      byType.select.forEach(entity => {
        console.log(`\n  ${entity.entity_id}`);
        console.log(`     Friendly Name: ${entity.attributes?.friendly_name || 'N/A'}`);
        console.log(`     Current State: ${entity.state}`);
        console.log(`     Options: ${JSON.stringify(entity.attributes?.options || [])}`);
      });
      console.log('\n');
    }
    
    // Display sensor entities
    if (byType.sensor.length > 0) {
      console.log('📈 SENSOR ENTITIES (Read-only):');
      byType.sensor.forEach(entity => {
        console.log(`\n  ${entity.entity_id}`);
        console.log(`     Friendly Name: ${entity.attributes?.friendly_name || 'N/A'}`);
        console.log(`     Current Value: ${entity.state} ${entity.attributes?.unit_of_measurement || ''}`);
      });
      console.log('\n');
    }
    
    // Summary
    console.log('📝 SUMMARY:');
    console.log(`   Total CloudForge entities: ${cloudforgeEntities.length}`);
    console.log(`   Number entities (intensity control): ${byType.number.length}`);
    console.log(`   Select entities (mode control): ${byType.select.length}`);
    console.log(`   Sensor entities (read-only): ${byType.sensor.length}`);
    
    if (byType.number.length === 0) {
      console.log('\n⚠️  CONCLUSION: CloudForge T5 does NOT have intensity/level control.');
      console.log('   Control is limited to: On/Off/Auto modes only.');
      console.log('   To modulate humidity output, you must:');
      console.log('   1. Use On/Off cycling (current approach)');
      console.log('   2. Coordinate with exhaust fan power (current approach)');
      console.log('   3. Adjust temperature to affect VPD');
    } else {
      console.log('\n✅ CONCLUSION: CloudForge T5 HAS intensity/level control!');
      console.log('   You can modulate humidity output directly.');
      console.log('\n   Next steps:');
      console.log('   1. Add the number entity to entities.js');
      console.log('   2. Update environment-controller.js to use intensity control');
      console.log('   3. Update AI prompts to mention intensity control');
    }
    
    return {
      hasIntensityControl: byType.number.length > 0,
      numberEntities: byType.number,
      selectEntities: byType.select,
      allEntities: cloudforgeEntities,
    };
    
  } catch (error) {
    console.error('❌ Error checking entities:', error);
    throw error;
  }
}
