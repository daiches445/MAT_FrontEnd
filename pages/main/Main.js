import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Button, SafeAreaView } from 'react-native';

import { BleManager, Device } from 'react-native-ble-plx';
import { manager } from '../../App';
import { BLEcontext } from '../../App';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from './Home';
import Stats from './Stats';
import * as colors from '../../styles/colors';

const Tab = createBottomTabNavigator();

export default function Main() {
    return (
        <Tab.Navigator initialRouteName='Home'
            screenOptions={
                { headerShown: false, tabBarStyle: { backgroundColor: colors.PRIMARY } }}>
            <Tab.Screen name="Home" component={Home}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color }) => (<MaterialCommunityIcons name='home' color={color} size={24}></MaterialCommunityIcons>)
                }}
            />
            <Tab.Screen name="Stats" component={Stats}
                options={{
                    tabBarLabel: "Info",
                    tabBarIcon: ({ color }) => (<MaterialCommunityIcons name='car-info' color={color} size={24}></MaterialCommunityIcons>)
                }} />
        </Tab.Navigator>
    )
}