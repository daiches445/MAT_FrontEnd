import React, { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native'

import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';


export default function Header() {

    const title_x = useRef(new Animated.Value(0)).current;
    const title_y = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        Animated.parallel([
            Animated.spring(title_x,{
                delay:500,
                mass:3,
                toValue:0,
                useNativeDriver:true
            }),
            Animated.spring(title_y,{
                delay:500,
                friction:3,
                toValue:17,
                useNativeDriver:true
            })
        ],).start();
    }, [])

    return (
        <View style={styles.container}>
            <View style={styles.title_view}>
                <Animated.Text style={{
                    position: "relative",
                    fontFamily: fonts.TITLE_heroworship_grad,
                    color: colors.TITLE_SHADOW,
                    fontSize: 120,
                    transform:[{translateX:title_x},{translateY:title_y}]
                }}>MAT</Animated.Text>
                <Text style={styles.secondery_title}>MAT</Text>
            </View>
            <Text style={styles.welcome_txt}>welcome</Text>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        height: Dimensions.get('window').height * 0.4,
        justifyContent: 'center',
        alignSelf: 'center'
    },
    title_view: {
    },
    title: {
        position: "relative",
        fontFamily: fonts.TITLE_heroworship_grad,
        color: colors.TITLE_SHADOW,
        fontSize: 100,
        right: 10,
        top: 17

    },
    secondery_title: {
        position: "absolute",
        fontFamily: fonts.TITLE_heroworship,
        color: colors.BLACK,
        fontSize: 120,

    },
    welcome_txt: {
        marginTop: 20,
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 30,
        textAlign: 'center'
    }

})