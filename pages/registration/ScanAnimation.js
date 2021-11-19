import React, { useRef,useEffect } from 'react'
import { Animated, View, Text, Dimensions } from 'react-native'
import { transparent } from '../../styles/colors';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome5.Button)

const windowHeight = Dimensions.get("window").height;
const windowWidth = Dimensions.get("window").width;


export default function ScanAnimation() {

    const icon_size = 70;
    const search_icon_x = useRef(new Animated.Value(icon_size)).current
    const search_icon_y = useRef(new Animated.Value(30)).current

    useEffect(() => {

        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(search_icon_x, {
                        useNativeDriver: true,
                        mass:1,
                        toValue: windowWidth - icon_size * 2
                    }),
                    Animated.spring(search_icon_y, {
                        useNativeDriver: true,
                        mass:1,
                        toValue: windowHeight * 0.2
                    })
                ]), Animated.spring(search_icon_y, {
                    useNativeDriver: true,
                    mass:1,
                    toValue: 30,
                }),
                Animated.parallel([
                    Animated.spring(search_icon_x, {
                        useNativeDriver: true,
                        mass:1,
                        toValue: icon_size
                    }),
                    Animated.spring(search_icon_y, {
                        useNativeDriver: true,
                        mass:1,
                        toValue: windowHeight * 0.2
                    })
                ]), Animated.spring(search_icon_y, {
                    useNativeDriver: true,
                    mass:1,
                    toValue: 30
                })
            ])

        ).start();
    }, [])

    return (
        <View>
            <AnimatedIcon iconStyle={{textAlign:"center",width:100}} name="search" size={icon_size} color="black" backgroundColor="white" style={
                {   
                    textAlign:"center",
                    right:20,
                    marginTop: 30,
                    transform: [{ translateX: search_icon_x }, { translateY: search_icon_y }]
                }} />
        </View>
    )
}
