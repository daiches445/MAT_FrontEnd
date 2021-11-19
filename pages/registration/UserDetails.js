import React, { useState, useReducer, useContext, useRef } from 'react';
import {Animated, StyleSheet, Text, View ,Dimensions} from 'react-native';
import { TextInput, Button,Divider } from 'react-native-paper'
import { moto } from './moto_brands';
import { UserContext } from './Register';
import uuid from 'react-native-uuid';
import EncryptedStorage from 'react-native-encrypted-storage';
import ShakeText from 'react-native-shake-text';
import * as fonts from '../../styles/typography';
import { set } from 'react-native-reanimated';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function UserDetails({ navigation }) {

    const userCtx = useContext(UserContext);
    const [error_txt, setErrTxt] = useState("");
    const shake_text_ref  = useRef(new Animated.Value(0)).current;

    const VerifyForm = () => {
        
        let err = "";
        let fields = userCtx.state;
        let regex = /^\w+$/;
        let email_regex = /^\S+@\S+\.\S+$/

        for (const key in fields) {

            if (Object.hasOwnProperty.call(fields, key)) {
                const element = fields[key];

                if (key != "email" && key != "re_email") {
                    if (element.length > 20) {
                        err = key + " is longer then 20 digits."
                        break;
                    }

                    if (!regex.test(element)) {
                        console.log(key + "==", regex.test(element));
                        err = key + " has ilegal Characters."
                    }
                }
                else {
                    if (!email_regex.test(element)) {
                        console.log(key + "==", regex.test(element));
                        err = key + " Invalid."
                    }
                }

                if (element.length < 5) {
                    err = key + " is shorter then 5 digits."
                    break;
                }
            }
        }

        if (fields.password !== fields.re_password) {
            err = "Passwords dont match."
        }

        if (fields.email !== fields.re_email) {
            err = "Email address dont match."
        }
        console.log(shake_text_ref);
        setErrTxt(err);

        shake_text_ref.setValue(0);
        Animated.spring(shake_text_ref,{
            bounciness:2,
            useNativeDriver:true,
            toValue:1
        }).start();

        if (err == "") {
            let val = { username: fields.username, password: fields.password }
            navigation.navigate("DeviceSearch");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create A User </Text>
            <View style={styles.fields_view}>
                <TextInput mode="outlined"  label="username" placeholder="5 -20 digits"  onChangeText={(value) => { userCtx.dispatch({ type: "username", value }) }} />
                <TextInput mode="outlined"  label="password" placeholder="5 -20 digits" secureTextEntry={true} onChangeText={(value) => { userCtx.dispatch({ type: "password", value }) }} />
                <TextInput mode="outlined"  label="validate password" secureTextEntry={true} onChangeText={(value) => { userCtx.dispatch({ type: "re_password", value }) }} />
                <TextInput mode="outlined"  label="email" onChangeText={(value) => { userCtx.dispatch({ type: "email", value }) }} />
                <TextInput mode="outlined"  label="validate email" onChangeText={(value) => { userCtx.dispatch({ type: "re_email", value }) }} />
                <Animated.Text style={{color:"red",textAlign:"center",margin:15, transform:[{scale:shake_text_ref}]}}>{error_txt}</Animated.Text>
            </View>

            {/* <TextInput placeholder="MAT code" onChangeText={(value) => {userCtx.dispatch({ type: "mat_code", value }) }} /> */}

            {/* <Text>{JSON.stringify(userCtx.state)}</Text> */}
            <Button onPress={VerifyForm} mode="contained" style={styles.next_btn}>next</Button>
        </View>
    )

}

const styles = StyleSheet.create({
    container:{
        alignItems:"center"
    },  
    title:{
        fontSize:50,
        fontFamily:fonts.TITLE_big_noodle_titling,
        margin:20
    },
    fields_view: {
        marginTop:20,
        height:windowHeight*0.6,
        width:windowWidth * 0.8,
        
    },
    next_btn:{
        color:"red",
        width:windowWidth*0.3,
        alignSelf:"center",
        margin:40
    },
    error: {
        color: "red",
        fontWeight: "bold",
    }
})