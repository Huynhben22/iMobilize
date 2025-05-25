import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { CommonStyles } from '../styles';

export const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  secondary = false, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        secondary ? CommonStyles.buttonSecondary : CommonStyles.button,
        disabled && { opacity: 0.6 },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        secondary ? CommonStyles.buttonTextSecondary : CommonStyles.buttonText,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};