import React from 'react'
import { View,StyleSheet ,Dimensions} from 'react-native'

import * as colors from '../../styles/colors';
import { TextInput } from 'react-native-paper';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


export default function Form(props) {
    return (
        <View style={styles.inputs_cont}>
            <TextInput style={styles.input} label="Username" mode="outlined"  maxLength={20}  onChangeText={props.setUsername} />
            <TextInput style={styles.input} label="Password" mode="outlined"  maxLength={20}  onChangeText={props.setPassword} secureTextEntry={true}/>
        </View>
    )
}
const styles = StyleSheet.create({

    inputs_cont: {
        height: windowHeight * 0.15,
        width:windowWidth*0.8,
        margin: 5,
        alignSelf:"center",
        justifyContent: "space-between"
    },
    input: {
        height:40,
    }
})