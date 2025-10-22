/**
 * ButtonFactory.ts
 * 
 * Factory for creating pre-configured touch buttons for common game actions
 */

import { TouchButton } from './TouchButton.js';
import { PauseIcon, PlayIcon, RestartIcon, DebugIcon, AccelerometerIcon, KeyboardIcon } from './ButtonIcons.js';
import type { TouchButtonConfig } from '../../types/touchButton.js';

/**
 * Factory class for creating common game buttons
 */
export class ButtonFactory {
  /**
   * Create a pause button
   * @param position - Button position
   * @param onPress - Press callback
   * @returns Configured pause button
   */
  static createPauseButton(
    position: { x: number; y: number },
    onPress: () => void
  ): TouchButton {
    const config: TouchButtonConfig = {
      id: 'pause',
      position,
      size: 50,
      icon: new PauseIcon(),
      onPress,
      opacity: 0.7,
      pressedOpacity: 1.0,
      color: '#ffffff',
      pressedColor: '#ffaa00'
    };
    
    return new TouchButton(config);
  }
  
  /**
   * Create a resume/play button
   * @param position - Button position
   * @param onPress - Press callback
   * @returns Configured resume button
   */
  static createResumeButton(
    position: { x: number; y: number },
    onPress: () => void
  ): TouchButton {
    const config: TouchButtonConfig = {
      id: 'resume',
      position,
      size: 50,
      icon: new PlayIcon(),
      onPress,
      opacity: 0.7,
      pressedOpacity: 1.0,
      color: '#ffffff',
      pressedColor: '#00ff88'
    };
    
    return new TouchButton(config);
  }
  
  /**
   * Create a restart button
   * @param position - Button position
   * @param onPress - Press callback
   * @returns Configured restart button
   */
  static createRestartButton(
    position: { x: number; y: number },
    onPress: () => void
  ): TouchButton {
    const config: TouchButtonConfig = {
      id: 'restart',
      position,
      size: 60,
      icon: new RestartIcon(),
      onPress,
      opacity: 0.8,
      pressedOpacity: 1.0,
      color: '#00ff88',
      pressedColor: '#ffbf00'
    };
    
    return new TouchButton(config);
  }
  
  /**
   * Create a debug toggle button
   * @param position - Button position
   * @param onPress - Press callback
   * @returns Configured debug button
   */
  static createDebugToggleButton(
    position: { x: number; y: number },
    onPress: () => void
  ): TouchButton {
    const config: TouchButtonConfig = {
      id: 'debug',
      position,
      size: 45,
      icon: new DebugIcon(),
      onPress,
      opacity: 0.6,
      pressedOpacity: 1.0,
      color: '#ffffff',
      pressedColor: '#ff00ff'
    };
    
    return new TouchButton(config);
  }
  
  /**
   * Create an accelerometer toggle button
   * @param position - Button position
   * @param onPress - Press callback
   * @returns Configured accelerometer button
   */
  static createAccelerometerToggleButton(
    position: { x: number; y: number },
    onPress: () => void
  ): TouchButton {
    const config: TouchButtonConfig = {
      id: 'accelerometer',
      position,
      size: 45,
      icon: new AccelerometerIcon(),
      onPress,
      opacity: 0.6,
      pressedOpacity: 1.0,
      color: '#ffffff',
      pressedColor: '#00aaff'
    };
    
    return new TouchButton(config);
  }
  
  /**
   * Create a keyboard toggle button
   * @param position - Button position
   * @param onPress - Press callback
   * @returns Configured keyboard button
   */
  static createKeyboardToggleButton(
    position: { x: number; y: number },
    onPress: () => void
  ): TouchButton {
    const config: TouchButtonConfig = {
      id: 'keyboard',
      position,
      size: 45,
      icon: new KeyboardIcon(),
      onPress,
      opacity: 0.6,
      pressedOpacity: 1.0,
      color: '#ffffff',
      pressedColor: '#00aaff'
    };
    
    return new TouchButton(config);
  }
  
  /**
   * Create a custom button with default styling
   * @param id - Button ID
   * @param position - Button position
   * @param icon - Button icon
   * @param onPress - Press callback
   * @param size - Button size (default: 50)
   * @returns Configured custom button
   */
  static createCustomButton(
    id: string,
    position: { x: number; y: number },
    icon: TouchButtonConfig['icon'],
    onPress: () => void,
    size: number = 50
  ): TouchButton {
    const config: TouchButtonConfig = {
      id,
      position,
      size,
      icon,
      onPress,
      opacity: 0.7,
      pressedOpacity: 1.0,
      color: '#ffffff',
      pressedColor: '#00ff88'
    };
    
    return new TouchButton(config);
  }
}
