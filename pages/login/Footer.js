import React from 'react'
import { View, Text ,StyleSheet,Dimensions} from 'react-native'

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function Footer() {
    return (
        <View style ={styles.container}>
            <Text></Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        alignSelf:"flex-end",
        backgroundColor:"red",
    }
})