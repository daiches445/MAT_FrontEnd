import React, { useState } from 'react';

import { StyleSheet, View, Text, ScrollView, TextInput, Button, SafeAreaView } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from './Home';
import Stats from './Stats';
import { TITLE_SHADOW } from '../../styles/colors';

const Tab = createBottomTabNavigator();

export default function Main() {
    return (
        <Tab.Navigator initialRouteName='Home'
            
            screenOptions={
                {headerShown:false,tabBarStyle:{backgroundColor:"black"}}}
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