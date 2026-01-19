/**
 * Script to check CloudForge T5 entities in Home Assistant
 * Run with: node scripts/check-cloudforge-entities.js
 */

import fetch from 'node-fetch';

const HA_URL = process.env.VITE_HA_URL || 'http://100.65.202.84:8123';
const HA_TOKEN = process.env.VITE_HA_TOKEN;

if (!HA_TOKEN) {
  console.error('Error: VITE_HA_TOKEN not set in environment');
  process.exit(1);
}

async function checkCloudForgeEntities() {
  try {
    console.log('🔍 Checking CloudForge T5 entities in Home Assistant...\n');
    
    // Get all entities
    const response = await fetch(`${HA_URL}/api/states`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const entities = await response.json();
    
    // Filter for CloudForge T5 entities
    const cloudforgeEntities = entities.filter(e => 
      e.entity_id.includes('cloudforge_t5') || 
      e.entity_id.includes('cloudforge_t')
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
      console.log('📊 NUMBER ENTITIES (Intensity/Level Control):');
      byType.number.forEach(entity => {
        console.log(`  ✅ ${entity.entity_id}`);
        console.log(`     Friendly Name: ${entity.attributes.friendly_name || 'N/A'}`);
        console.log(`     Current Value: ${entity.state}`);
        if (entity.attributes.min !== undefined) {
          console.log(`     Range: ${entity.attributes.min} - ${entity.attributes.max}`);
        }
        if (entity.attributes.step !== undefined) {
          console.log(`     Step: ${entity.attributes.step}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No NUMBER entities found for CloudForge T5');
      console.log('   This means there is NO intensity/level control available\n');
    }
    
    // Display select entities
    if (byType.select.length > 0) {
      console.log('📋 SELECT ENTITIES (Mode/Option Control):');
      byType.select.forEach(entity => {
        console.log(`  ✅ ${entity.entity_id}`);
        console.log(`     Friendly Name: ${entity.attributes.friendly_name || 'N/A'}`);
        console.log(`     Current State: ${entity.state}`);
        console.log(`     Options: ${JSON.stringify(entity.attributes.options || [])}`);
        console.log('');
      });
    }
    
    // Display sensor entities
    if (byType.sensor.length > 0) {
      console.log('📈 SENSOR ENTITIES (Read-only):');
      byType.sensor.forEach(entity => {
        console.log(`  ✅ ${entity.entity_id}`);
        console.log(`     Friendly Name: ${entity.attributes.friendly_name || 'N/A'}`);
        console.log(`     Current Value: ${entity.state} ${entity.attributes.unit_of_measurement || ''}`);
        console.log('');
      });
    }
    
    // Summary
    console.log('\n📝 SUMMARY:');
    console.log(`   Total CloudForge entities: ${cloudforgeEntities.length}`);
    console.log(`   Number entities (intensity control): ${byType.number.length}`);
    console.log(`   Select entities (mode control): ${byType.select.length}`);
    
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
    }
    
  } catch (error) {
    console.error('❌ Error checking entities:', error.message);
    process.exit(1);
  }
}

checkCloudForgeEntities();
