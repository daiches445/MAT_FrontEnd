import React, { useState } from 'react';

import { StyleSheet, View, Text, ScrollView, TextInput, Button, SafeAreaView } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from './main/Home';
import Stats from './main/Stats';

const Tab = createBottomTabNavigator();

export default function Main() {
    return (
        <Tab.Navigator initialRouteName='Home'
        screenOptions={{headerShown:false}}
        >
            <Tab.Screen name="Home" component={Home}
            options={{
                tabBarLabel:"Home",
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