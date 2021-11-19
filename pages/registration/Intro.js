import React, { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native'

import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';
import { Button } from 'react-native-paper';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;




export default function Intro({ navigation }) {
    const title_opacity = useRef(new Animated.Value(0)).current;
    const welcome_opacity = useRef(new Animated.Value(0)).current;
    const description_opacity = useRef(new Animated.Value(0)).current;
    const first_opacity = useRef(new Animated.Value(0)).current;
    const second_opacity = useRef(new Animated.Value(0)).current;
    const third_opacity = useRef(new Animated.Value(0)).current;
    const forth_opacity = useRef(new Animated.Value(0)).current;
    const btn_view_y = useRef(new Animated.Value(0)).current;


    useEffect(() => {

        Animated.sequence( [
            Animated.timing(title_opacity, {
                delay:1000,
                toValue: 1,
                mass:1,
                useNativeDriver: true
            }), Animated.timing(welcome_opacity, {
                mass:1,
                toValue: 1,
                useNativeDriver: true
            }), Animated.timing(description_opacity, {
                toValue: 1,
                useNativeDriver: true
            }), Animated.timing(first_opacity, {
                delay:2000,
                toValue: 1,
                useNativeDriver: true
            }), Animated.timing(second_opacity, {
                toValue: 1,
                useNativeDriver: true
            }), Animated.timing(third_opacity, {
                toValue: 1,
                useNativeDriver: true
            }),
            Animated.timing(forth_opacity, {
                toValue: 1,
                useNativeDriver: true
            }),
            Animated.spring(btn_view_y, {
                delay:1000,
                bounciness: 8,
                toValue: 1,
                useNativeDriver: true
            })
        ]).start();
    }, [])

    return (

        <View style={styles.container}>
            <Animated.Text style={
                {
                    opacity: title_opacity,
                    fontFamily: fonts.TITLE_big_noodle_titling,
                    fontSize: 60,
                    textAlign: "center",
                    marginTop: 20
                }} >WELCOME</Animated.Text>
            <Animated.Text style={{
                opacity: welcome_opacity,
                fontFamily: fonts.TITLE_big_noodle_titling,
                fontSize: 30,
                margin: 30
            }} >Thank you for choosing MAT.</Animated.Text>
            <Animated.Text style={{
                opacity: description_opacity,
                fontFamily: fonts.TITLE_big_noodle_titling,
                fontSize: 30,
                textAlign: "center"
            }} >Please make sure:</Animated.Text>
            <Animated.Text style={{
                opacity: first_opacity,
                fontFamily: fonts.TEXT_coolvetica_cond,
                fontSize: 25,
                margin: 10
            }} ><Text style={{ color: colors.TITLE_SHADOW, fontFamily: fonts.TITLE_big_noodle_titling }}>1. </Text>MAT device is ON.</Animated.Text>
            <Animated.Text style={{
                opacity: second_opacity,
                fontFamily: fonts.TEXT_coolvetica_cond,
                fontSize: 25,
                margin: 10
            }} ><Text style={{ color: colors.TITLE_SHADOW, fontFamily: fonts.TITLE_big_noodle_titling }}>2. </Text>MAT code in reach.</Animated.Text>
            <Animated.Text style={{
                opacity: third_opacity,
                fontFamily: fonts.TEXT_coolvetica_cond,
                textAlign: "center",
                fontSize: 25,
                margin: 10

            }} ><Text style={{ color: colors.TITLE_SHADOW, fontFamily: fonts.TITLE_big_noodle_titling }}>3. </Text>
                Network is avilable.</Animated.Text>
            <Animated.Text style={{
                opacity: forth_opacity,
                fontFamily: fonts.TEXT_coolvetica_cond,
                textAlign: "center",
                fontSize: 25,
                margin: 10

            }} ><Text style={{ color: colors.TITLE_SHADOW, fontFamily: fonts.TITLE_big_noodle_titling }}>4. </Text>
                Use valid and correct information.</Animated.Text>
            <Animated.View style={{
                margin: 40,
                transform: [{ scale: btn_view_y }]
            }}>
                <Button mode="contained" onPress={() => { navigation.navigate("DeviceSearch") }}>Got it</Button>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",

    },
    title: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 60,
    },
    text_1: {

    },
    text_2: {

    }
})