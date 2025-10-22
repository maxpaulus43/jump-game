/**
 * Quick ECS Core Verification Test
 * 
 * This file tests the basic functionality of the ECS core infrastructure
 * to ensure everything works correctly before integration.
 * 
 * Run with: npx tsx src/ecs/test-ecs.ts
 * Or just import and call testECSCore() from browser console
 */

import { ECSWorld, ComponentType } from './index';

// Test component classes
class Transform {
  static readonly type: ComponentType<Transform> = 'Transform' as ComponentType<Transform>;
  constructor(public x: number = 0, public y: number = 0) {}
}

class Velocity {
  static readonly type: ComponentType<Velocity> = 'Velocity' as ComponentType<Velocity>;
  constructor(public vx: number = 0, public vy: number = 0) {}
}

/**
 * Test ECS core functionality
 */
export function testECSCore(): boolean {
  console.log('🧪 Testing ECS Core Infrastructure...\n');

  const world = new ECSWorld();
  let passed = 0;
  let failed = 0;

  // Test 1: Entity creation
  console.log('Test 1: Entity Creation');
  const entity1 = world.createEntity();
  const entity2 = world.createEntity();
  const entity3 = world.createEntity();
  if (entity1 === 0 && entity2 === 1 && entity3 === 2) {
    console.log('✅ Entities created with sequential IDs');
    passed++;
  } else {
    console.log('❌ Entity IDs not sequential');
    failed++;
  }

  // Test 2: Component addition
  console.log('\nTest 2: Component Addition');
  world.addComponent(entity1, new Transform(100, 200));
  world.addComponent(entity1, new Velocity(5, 10));
  world.addComponent(entity2, new Transform(300, 400));
  const transform1 = world.getComponent(entity1, Transform.type);
  if (transform1 && transform1.x === 100 && transform1.y === 200) {
    console.log('✅ Components added and retrieved correctly');
    passed++;
  } else {
    console.log('❌ Component retrieval failed');
    failed++;
  }

  // Test 3: Query with single component
  console.log('\nTest 3: Query - Single Component');
  const withTransform = world.query({ with: [Transform.type] });
  if (withTransform.length === 2 && withTransform.includes(entity1) && withTransform.includes(entity2)) {
    console.log('✅ Single component query works');
    passed++;
  } else {
    console.log('❌ Single component query failed');
    failed++;
  }

  // Test 4: Query with multiple components (AND logic)
  console.log('\nTest 4: Query - Multiple Components (AND)');
  const withBoth = world.query({ with: [Transform.type, Velocity.type] });
  if (withBoth.length === 1 && withBoth.includes(entity1)) {
    console.log('✅ Multiple component query (AND) works');
    passed++;
  } else {
    console.log('❌ Multiple component query failed');
    failed++;
  }

  // Test 5: Query with exclusion (NOT logic)
  console.log('\nTest 5: Query - Exclusion (NOT)');
  const withoutVelocity = world.query({ 
    with: [Transform.type],
    without: [Velocity.type]
  });
  if (withoutVelocity.length === 1 && withoutVelocity.includes(entity2)) {
    console.log('✅ Exclusion query (NOT) works');
    passed++;
  } else {
    console.log('❌ Exclusion query failed');
    failed++;
  }

  // Test 6: Component removal
  console.log('\nTest 6: Component Removal');
  world.removeComponent(entity1, Velocity.type);
  const noVelocity = world.getComponent(entity1, Velocity.type);
  if (noVelocity === undefined) {
    console.log('✅ Component removal works');
    passed++;
  } else {
    console.log('❌ Component removal failed');
    failed++;
  }

  // Test 7: Entity destruction
  console.log('\nTest 7: Entity Destruction');
  world.destroyEntity(entity1);
  const isAlive = world.isAlive(entity1);
  const afterDestroy = world.query({ with: [Transform.type] });
  if (!isAlive && afterDestroy.length === 1 && afterDestroy.includes(entity2)) {
    console.log('✅ Entity destruction works');
    passed++;
  } else {
    console.log('❌ Entity destruction failed');
    failed++;
  }

  // Test 8: Performance test
  console.log('\nTest 8: Performance (10,000 entities)');
  const perfWorld = new ECSWorld();
  const startTime = performance.now();
  
  for (let i = 0; i < 10000; i++) {
    const entity = perfWorld.createEntity();
    perfWorld.addComponent(entity, new Transform(Math.random() * 1000, Math.random() * 1000));
    if (i % 2 === 0) {
      perfWorld.addComponent(entity, new Velocity(Math.random() * 10, Math.random() * 10));
    }
  }
  
  const createTime = performance.now() - startTime;
  
  const queryStart = performance.now();
  const movingEntities = perfWorld.query({ with: [Transform.type, Velocity.type] });
  const queryTime = performance.now() - queryStart;
  
  console.log(`  Created 10,000 entities in ${createTime.toFixed(2)}ms`);
  console.log(`  Queried ${movingEntities.length} entities in ${queryTime.toFixed(2)}ms`);
  
  if (createTime < 100 && queryTime < 10) {
    console.log('✅ Performance targets met');
    passed++;
  } else {
    console.log('❌ Performance below target');
    failed++;
  }

  // Test 9: Component replacement
  console.log('\nTest 9: Component Replacement');
  world.addComponent(entity2, new Transform(999, 888));
  const newTransform = world.getComponent(entity2, Transform.type);
  if (newTransform && newTransform.x === 999 && newTransform.y === 888) {
    console.log('✅ Component replacement works');
    passed++;
  } else {
    console.log('❌ Component replacement failed');
    failed++;
  }

  // Test 10: Entity count and stats
  console.log('\nTest 10: World Statistics');
  const entityCount = world.getEntityCount();
  const stats = world.getComponentStats();
  console.log(`  Active entities: ${entityCount}`);
  console.log(`  Component types: ${stats.types}`);
  console.log(`  Total components: ${stats.totalComponents}`);
  if (entityCount === 2 && stats.types === 2) {
    console.log('✅ Statistics correct');
    passed++;
  } else {
    console.log('❌ Statistics incorrect');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}/10`);
  console.log(`❌ Failed: ${failed}/10`);
  console.log('='.repeat(50));

  return failed === 0;
}

// Run tests if executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  (window as any).testECSCore = testECSCore;
  console.log('ECS test available. Run: testECSCore()');
}
