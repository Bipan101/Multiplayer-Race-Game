import { Car, Position, Velocity, Bottle, PowerUp } from '../types/game';

export class GamePhysics {
  static readonly FRICTION = 0.95;
  static readonly TURN_SPEED = 0.08;
  static readonly ACCELERATION = 0.5;
  static readonly BRAKE_FORCE = 0.8;
  static readonly MAX_SPEED = 8;
  static readonly BOTTLE_SPEED = 12;
  static readonly TRACK_WIDTH = 800;
  static readonly TRACK_HEIGHT = 600;

  /**
   * Updates car physics based on player input
   */
  static updateCarPhysics(car: Car, input: any): void {
    // Apply acceleration/braking
    if (input.up) {
      const forwardX = Math.cos(car.rotation) * this.ACCELERATION;
      const forwardY = Math.sin(car.rotation) * this.ACCELERATION;
      car.velocity.x += forwardX;
      car.velocity.y += forwardY;
    }
    
    if (input.down) {
      car.velocity.x *= this.BRAKE_FORCE;
      car.velocity.y *= this.BRAKE_FORCE;
    }

    // Apply turning (only when moving)
    const speed = Math.sqrt(car.velocity.x ** 2 + car.velocity.y ** 2);
    if (speed > 0.5) {
      if (input.left) {
        car.rotation -= this.TURN_SPEED * (speed / this.MAX_SPEED);
      }
      if (input.right) {
        car.rotation += this.TURN_SPEED * (speed / this.MAX_SPEED);
      }
    }

    // Apply friction
    car.velocity.x *= this.FRICTION;
    car.velocity.y *= this.FRICTION;

    // Limit max speed
    const currentSpeed = Math.sqrt(car.velocity.x ** 2 + car.velocity.y ** 2);
    if (currentSpeed > car.maxSpeed) {
      car.velocity.x = (car.velocity.x / currentSpeed) * car.maxSpeed;
      car.velocity.y = (car.velocity.y / currentSpeed) * car.maxSpeed;
    }

    // Update position
    car.position.x += car.velocity.x;
    car.position.y += car.velocity.y;

    // Keep car within bounds
    this.keepInBounds(car);
  }

  /**
   * Creates a bottle projectile
   */
  static createBottle(car: Car): Bottle {
    const bottleSpeed = this.BOTTLE_SPEED;
    const angle = car.rotation;
    
    return {
      id: `bottle_${Date.now()}_${Math.random()}`,
      position: {
        x: car.position.x + Math.cos(angle) * 40,
        y: car.position.y + Math.sin(angle) * 40
      },
      velocity: {
        x: Math.cos(angle) * bottleSpeed + car.velocity.x,
        y: Math.sin(angle) * bottleSpeed + car.velocity.y
      },
      playerId: car.playerId,
      damage: 20,
      active: true
    };
  }

  /**
   * Updates bottle physics
   */
  static updateBottlePhysics(bottle: Bottle): void {
    bottle.position.x += bottle.velocity.x;
    bottle.position.y += bottle.velocity.y;

    // Deactivate bottles that go out of bounds
    if (bottle.position.x < 0 || bottle.position.x > this.TRACK_WIDTH ||
        bottle.position.y < 0 || bottle.position.y > this.TRACK_HEIGHT) {
      bottle.active = false;
    }
  }

  /**
   * Checks collision between two circular objects
   */
  static checkCollision(pos1: Position, pos2: Position, radius1: number, radius2: number): boolean {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (radius1 + radius2);
  }

  /**
   * Handles collision between bottle and car
   */
  static handleBottleCarCollision(bottle: Bottle, car: Car): boolean {
    if (bottle.playerId === car.playerId || !bottle.active) return false;
    
    if (this.checkCollision(bottle.position, car.position, 5, 20)) {
      car.health -= bottle.damage;
      bottle.active = false;
      
      // Add knockback effect
      const knockbackForce = 3;
      const angle = Math.atan2(car.position.y - bottle.position.y, car.position.x - bottle.position.x);
      car.velocity.x += Math.cos(angle) * knockbackForce;
      car.velocity.y += Math.sin(angle) * knockbackForce;
      
      return true;
    }
    return false;
  }

  /**
   * Handles power-up collection
   */
  static handlePowerUpCollection(powerUp: PowerUp, car: Car): boolean {
    if (powerUp.collected) return false;
    
    if (this.checkCollision(powerUp.position, car.position, 15, 20)) {
      powerUp.collected = true;
      this.applyPowerUp(powerUp, car);
      return true;
    }
    return false;
  }

  /**
   * Applies power-up effects to car
   */
  static applyPowerUp(powerUp: PowerUp, car: Car): void {
    switch (powerUp.type) {
      case 'speed':
        car.maxSpeed = Math.min(car.maxSpeed + 2, 12);
        setTimeout(() => {
          car.maxSpeed = this.MAX_SPEED;
        }, 5000);
        break;
      case 'shield':
        // Add shield power-up to car
        car.powerUps.push({
          ...powerUp,
          duration: 8000
        });
        break;
      case 'health':
        car.health = Math.min(car.health + 30, car.maxHealth);
        break;
      case 'bottles':
        car.bottles += 3;
        break;
    }
  }

  /**
   * Keeps car within track bounds
   */
  private static keepInBounds(car: Car): void {
    const margin = 20;
    
    if (car.position.x < margin) {
      car.position.x = margin;
      car.velocity.x = Math.abs(car.velocity.x) * 0.5;
    }
    if (car.position.x > this.TRACK_WIDTH - margin) {
      car.position.x = this.TRACK_WIDTH - margin;
      car.velocity.x = -Math.abs(car.velocity.x) * 0.5;
    }
    if (car.position.y < margin) {
      car.position.y = margin;
      car.velocity.y = Math.abs(car.velocity.y) * 0.5;
    }
    if (car.position.y > this.TRACK_HEIGHT - margin) {
      car.position.y = this.TRACK_HEIGHT - margin;
      car.velocity.y = -Math.abs(car.velocity.y) * 0.5;
    }
  }

  /**
   * Generates random power-up positions
   */
  static generatePowerUpPositions(count: number): Position[] {
    const positions: Position[] = [];
    const margin = 50;
    
    for (let i = 0; i < count; i++) {
      positions.push({
        x: margin + Math.random() * (this.TRACK_WIDTH - 2 * margin),
        y: margin + Math.random() * (this.TRACK_HEIGHT - 2 * margin)
      });
    }
    
    return positions;
  }
}