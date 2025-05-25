import React from 'react';
import { View, Text } from 'react-native';
import { CommonStyles } from '../styles';

export const Header = ({ title }) => {
  return (
    <View style={CommonStyles.header}>
      <Text style={CommonStyles.headerText}>{title}</Text>
    </View>
  );
};