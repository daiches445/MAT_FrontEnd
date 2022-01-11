import React, { useRef } from 'react'
import { View, StyleSheet, Dimensions, Animated } from 'react-native'

import * as colors from '../../styles/colors';
import { TextInput } from 'react-native-paper';
import { useEffect } from 'react';
import { TEXT_Mohave } from '../../styles/typography';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


export default function Form(props) {

    const shake_text_ref = useRef(new Animated.Value(0)).current;
    const opacity_text_ref = useRef(new Animated.Value(0)).current;

    function AnimateErrorText() {
        
        shake_text_ref.setValue(0);
            Animated.parallel([
                Animated.spring(shake_text_ref, {
                    damping: 5,
                    useNativeDriver: true,
                    toValue: 2,
                }),
                Animated.spring(opacity_text_ref, {
                    speed: 100,
                    useNativeDriver: true,
                    toValue: 1
                })
            ]).start();

    }

    useEffect(()=>{
        
        AnimateErrorText();
    }
    ,[props.err_text])



    return (
        <View style={styles.inputs_cont}>
            <TextInput style={styles.input} label="Username" mode="outlined" maxLength={20} onChangeText={props.setUsername} />
            <TextInput style={styles.input} label="Password" mode="outlined" maxLength={20} onChangeText={props.setPassword} secureTextEntry={true} />
            <Animated.Text style={{
                top:3,
                textAlign:"center",
                fontFamily:TEXT_Mohave,
                color: "red",
                opacity: opacity_text_ref,
                transform: [{ translateX: shake_text_ref }]
            }}>
                {props.err_text}</Animated.Text>
        </View>
    )
}
const styles = StyleSheet.create({

    inputs_cont: {
        height: windowHeight * 0.15,
        width: windowWidth * 0.8,
        margin: 5,
        alignSelf: "center",
        justifyContent: "space-between"
    },
    input: {
        height: 40,
    }
})