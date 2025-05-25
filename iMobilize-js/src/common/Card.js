import React from 'react';
import { View } from 'react-native';
import { CommonStyles } from '../styles';

export const Card = ({ children, style, large = false }) => {
  return (
    <View style={[large ? CommonStyles.cardLarge : CommonStyles.card, style]}>
      {children}
    </View>
  );
};