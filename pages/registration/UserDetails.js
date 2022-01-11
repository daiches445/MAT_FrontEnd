import React, { useState, useReducer, useContext, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, ScrollView } from 'react-native';
import { TextInput, Button, Checkbox, Surface } from 'react-native-paper'
import { moto } from './moto_brands';
import { UserContext } from './Register';
import * as fonts from '../../styles/typography';
import Divider from '../../styles/Divider';
import { API_CHECK_USER } from '../FecthAPI';
import Intro from './Intro';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function UserDetails({ navigation }) {

    const userCtx = useContext(UserContext);
    const [error_txt, setErrTxt] = useState("");
    const [checked, setChecked] = useState(false);
    const shake_text_ref = useRef(new Animated.Value(0)).current;

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
                if (key !== "first_name" && key !== 'last_name') {
                    console.log(key);
                    if (element.length < 5) {
                        err = key + " is shorter then 5 digits."
                        break;
                    }
                } else {
                    if (element.length < 2) {
                        err = "First/Last name is shorter then 2 digits."
                        break;
                    }
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
        Animated.spring(shake_text_ref, {
            bounciness: 2,
            useNativeDriver: true,
            toValue: 1
        }).start();

        if (err == "") {

            //CheckData();
            navigation.navigate("DeviceSearch");
        }
    }

    async function CheckData() {
        try {

            const fetch_url = API_CHECK_USER
            const data = {
                username: "TEST2222",
                email: userCtx.state.email,
                first_name: "",
                last_name: ""
            }

            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Accept", "application/json");

            var raw = JSON.stringify({
                "username": "123Pa$$word!",
                "email": "superadmin@gmail.com"
            });

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };

            await fetch(fetch_url, requestOptions).then(res => {
                console.log(res);
            })

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <View style={styles.container}>
            <Intro />
            <Text style={styles.title}>Create an account</Text>
            <Surface style={styles.surface}>
                <Text style={styles.desc_txt}>please make sure to use valid information.</Text>

            </Surface>

            <View style={styles.fields_view}>
                <TextInput style={styles.input} mode="flat" label="Username" placeholder="5 -20 digits" onChangeText={(value) => { userCtx.dispatch({ type: "username", value }) }} />
                <Divider />
                <TextInput style={styles.input} mode="flat" label="Password" placeholder="5 -20 digits" secureTextEntry={true} onChangeText={(value) => { userCtx.dispatch({ type: "password", value }) }} />
                <TextInput style={styles.input} mode="flat" label="Confirm password" secureTextEntry={true} onChangeText={(value) => { userCtx.dispatch({ type: "re_password", value }) }} />
                <Divider />

                <TextInput style={styles.input} mode="flat" label="Email" onChangeText={(value) => { userCtx.dispatch({ type: "email", value }) }} />
                <TextInput style={styles.input} mode="flat" label="Confirm email" onChangeText={(value) => { userCtx.dispatch({ type: "re_email", value }) }} />

                <Animated.Text style={{ color: "red", textAlign: "center", margin: 15, transform: [{ scale: shake_text_ref }] }}>
                    {error_txt}</Animated.Text>

            </View>
            <View style={styles.chk_box_cont}>
                <Checkbox status={checked ? "checked" : "unchecked"} onPress={() => { setChecked(!checked) }} />
                <Text style={styles.terms_txt}>i understand and agree to terms and conditions</Text>
            </View>
            <Button disabled={!checked} onPress={VerifyForm} mode="contained" style={styles.next_btn}>next</Button>

        </View>
    )

}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        height: windowHeight
    },
    title: {
        fontSize: 50,
        fontFamily: fonts.TITLE_big_noodle_titling,
        margin: 20
    },
    surface:{
        elevation:4
    },
    desc_txt: {
        width: windowWidth * 0.6,
        backgroundColor: 'rgba(255,0,0,0.7)',
        textAlign: "center",
        fontFamily: fonts.TEXT_Mohave,
        fontSize: 20,
        borderRadius: 2,
        elevation: 2

    },
    fields_view: {
        marginTop: 20,
        width: windowWidth * 0.8,
    },
    input: {
        fontFamily: fonts.TEXT_coolvetica_cond,
        margin: 2,
        height: 60
    },
    chk_box_cont: {
        flexWrap: "nowrap",
        flexDirection: "row",
        alignItems: "center"
    },
    terms_txt: {
        fontFamily: fonts.TEXT_Mohave_variable
    },
    next_btn: {
        width: windowWidth * 0.3,
        alignSelf: "center",
        margin: 0
    },
    error: {
        color: "red",
        fontWeight: "bold",
    }
})