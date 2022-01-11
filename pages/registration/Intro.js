import React, { useState, useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native'

import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';
import { Button, Modal, Portal, Provider } from 'react-native-paper';
import Dialog from 'react-native-dialog';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;




export default function Intro({ navigation }) {

    const [dialog_visible, setDialogVisible] = useState(true);
    const title_opacity = useRef(new Animated.Value(0)).current;
    const welcome_opacity = useRef(new Animated.Value(0)).current;
    const description_opacity = useRef(new Animated.Value(0)).current;
    const notice_scale = useRef(new Animated.Value(0)).current;


    const first_opacity = useRef(new Animated.Value(0)).current;
    const second_opacity = useRef(new Animated.Value(0)).current;
    const third_opacity = useRef(new Animated.Value(0)).current;
    const forth_opacity = useRef(new Animated.Value(0)).current;
    const btn_view_y = useRef(new Animated.Value(0)).current;


    useEffect(() => {

        Animated.sequence([
            Animated.timing(title_opacity, {
                delay: 1000,
                toValue: 1,
                mass: 1,
                useNativeDriver: true
            }), Animated.timing(welcome_opacity, {
                mass: 1,
                toValue: 1,
                useNativeDriver: true
            }), Animated.timing(description_opacity, {
                toValue: 1,
                useNativeDriver: true
            }), Animated.timing(notice_scale, {
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
                bounciness: 8,
                toValue: 1,
                useNativeDriver: true
            })
        ]).start();
    }, [])

    return (
        <Dialog.Container visible={dialog_visible} contentStyle={styles.container}>
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
                textAlign: "center",
                margin: 30
            }} >Thank you for choosing MAT.</Animated.Text>
            <Animated.Text style={{
                opacity: description_opacity,
                fontFamily: fonts.TEXT_Mohave,
                fontSize: 20,
                textAlign: "center"
            }} >Please follow instructions carefully.{"\n"}Also,make sure to use correct and valid information.</Animated.Text>
            <Animated.Text style={{
                marginTop:20,
                transform: [{ scale: notice_scale }],
                fontFamily: fonts.TEXT_Mohave,
                fontSize: 20,
                textAlign: "center",
                color:"red"
            }}>DISCLAIMER:{"\n"}MAT is <Text style={styles.NOT_txt}>NOT </Text>responsible for any damage or theft might be occur.</Animated.Text>
            <Animated.View style={{
                margin: 40,
                transform: [{ scale: btn_view_y }],
                
            }}>
                <Button  mode="contained" onPress={() => { setDialogVisible(false) }}>LETS GO</Button>
            </Animated.View>
        </Dialog.Container>
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
    NOT_txt: {
        fontFamily: fonts.TEXT_Mohave,
        fontSize: 20,
        color:"red"
    }

})