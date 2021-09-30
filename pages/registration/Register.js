import React, { useState, useContext, useReducer } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Button, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserDetails from './UserDetails';
import BT_conn from './BT_conn';

const Stack = createNativeStackNavigator();
export const UserContext = React.createContext();

export default function Register() {
    // mat_code: "28916d26-a0c7-42c4-b45c-0069ed7c37fc"

    const initialState = {
        username: "init_user",
        password: "init_pass",
        re_password: "init_pass",
        mat_code: "28916d2",
        email: "email@email.com",
        re_email: "email@email.com",
        uuid:""
    }

    reducer = (state, action) => {
        switch (action.type) {
            case "username":
                return { ...state, username: action.value }
            case "password":
                return { ...state, password: action.value }
            case "re_password":
                return { ...state, re_password: action.value }
            case "mat_code":
                return { ...state, mat_code: action.value }
            case "email":
                return { ...state, email: action.value }
            case "re_email":
                return { ...state, re_email: action.value }
            case "uuid":
                return { ...state, uuid: action.value }

            default:
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, initialState)

    return (
        <UserContext.Provider value={{ state: state, dispatch: dispatch }}>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name="UserDetails" component={UserDetails} />
                <Stack.Screen name="BT_conn" component={BT_conn} />{/*try to 'modal'-style/pop up  */}
            </Stack.Navigator>
        </UserContext.Provider>

    )


}

const styles = StyleSheet.create({
    title: {
        fontSize: 100,
        color: "red"
    }
})
