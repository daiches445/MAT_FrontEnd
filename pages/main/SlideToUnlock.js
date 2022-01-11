import React, { useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { TITLE_SHADOW } from '../../styles/colors';
import { TEXT_coolvetica_cond, TITLE_big_noodle_titling } from '../../styles/typography';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const SWITCH_BUTTON_WIDTH = windowWidth * 0.5
const SWITCH_BUTTON_HEIGHT = windowWidth * 0.3
const HEADER_HEIGHT = windowWidth * 0.3

export default function SlideToUnlock(props) {
    const rail_height = props.height;
    const touch = useRef(new Animated.Value(HEADER_HEIGHT)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderMove: Animated.event(
                [
                    null,
                    { dy: touch },

                ], {
                    useNativeDriver: true
                }
            ),
            onPanResponderRelease: (e) => {
                let Y = e.nativeEvent.locationY;
                console.log("release");
                if (Y > SWITCH_BUTTON_HEIGHT - 40) {

                    Animated.spring(touch, {
                        useNativeDriver: false,
                        toValue: SWITCH_BUTTON_HEIGHT
                    }).start();
                }
                else {

                    Animated.spring(touch, {
                        useNativeDriver: false,
                        toValue: 0
                    }).start();
                }
            }
        })
    ).current;


    return (
        <View style={styles.slider_rail} >
            <Animated.View
                onStartShouldSetResponder={eve => true}
                onMoveShouldSetResponder={eve => true}

                onResponderMove={e => {
                    let Y = e.nativeEvent.locationY;
                    console.log("Y", Y);
                    // console.log("prevY",prevY.current);
                    prevY.current = Y;
                    // if (Y > 0 && Y < SWITCH_BUTTON_HEIGHT) {
                    //     console.log(Math.abs(prevY.current - Y));
                    //     if(Math.abs(prevY.current - Y) < 20)
                    //         {
                    //             prevY.current = Y;
                    //             touch.setValue(Y)
                    //         }
                    // }
                }}
                onResponderRelease={e => {
                    let Y = e.nativeEvent.locationY;
                    console.log("release");
                    if (Y > SWITCH_BUTTON_HEIGHT - 40)
                        Animated.spring(touch, {
                            useNativeDriver: false,
                            toValue: SWITCH_BUTTON_HEIGHT
                        }).start();
                    else {
                        Animated.spring(touch, {
                            useNativeDriver: false,
                            toValue: 0
                        }).start();
                    }
                }}

                style={{
                    position: "absolute",
                    zIndex: 999,
                    backgroundColor: "red",
                    width: windowWidth * 0.5,
                    height: SWITCH_BUTTON_HEIGHT,
                    transform: [{ translateY: touch }]
                }} />
            <Text style={styles.slider_text}>slide to unlock</Text>
            <MaterialCommunityIcons name="lock" size={45} style={styles.lock_icon}></MaterialCommunityIcons>
        </View>
    )
}

const styles = StyleSheet.create({
    slider_rail: {
        height: 50,
        width: 230,
        backgroundColor: "grey",
        justifyContent: 'center',
        borderRadius: 5

    },
    slider: {
        height: 40,
        width: 40,
        backgroundColor: "black",
        margin: 2,
        borderRadius: 5
    },
    slider_text: {
        position: 'absolute',
        left: 50,
        fontSize: 30,
        fontFamily: TITLE_big_noodle_titling
    },
    lock_icon: {
        backgroundColor: TITLE_SHADOW,
        width: 47,
        borderRadius: 5,
        margin: 2,
        borderWidth: 1,
    }

})