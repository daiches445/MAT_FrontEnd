import React, { useState, useReducer, useContext } from 'react';
import { StyleSheet, Button, Text, TextInput, View } from 'react-native';
import { moto } from './moto_brands';
import { UserContext } from './Register';
import uuid from 'react-native-uuid';
import EncryptedStorage from 'react-native-encrypted-storage';
import ShakingText from 'react-native-shaking-text';

export default function UserDetails({ navigation }) {

    const userCtx = useContext(UserContext);
    const [error_txt, setErrorTxt] = useState("");


    async function SetID({username,password}) {

        let token = username+password;
        let id = uuid.v4();
        console.log("ID ===",id);
        console.log("TOKEN ===",token);
        //SAVE ID

        try {
            await EncryptedStorage.setItem(token, id);
            return id;
        } catch (error) {
            console.log("CATCH ERROR FORM REGISTER ===", error);
        }


        //GET SAVED ID
        // try {
        //     let stam = await EncryptedStorage.getItem("id")
        //     console.log("VALUE ===== ", stam);
        // } catch (error) {
        //     console.log("CATCH ERROR FORM REGISTER ===", error);
        // }

    }

    const VerifyForm = () => {
        let err = "";
        let fields = userCtx.state;
        let regex = /^\w+$/;
        let email_regex = /^\S+@\S+\.\S+$/

        console.log(fields);

        for (const key in fields) {

            if (Object.hasOwnProperty.call(fields, key)) {
                const element = fields[key];

                if(key != "email" && key !="re_email"){
                    if (element.length > 20) {
                        err = key + " is longer then 20 digits."
                        break;
                    }
    
                    if (!regex.test(element)) {
                        console.log(key + "==", regex.test(element));
                        err = key + " has ilegal Characters."
                    }
                }
                else{
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

        if(fields.password !== fields.re_password){
            err = "Passwords dont match."
        }

        if(fields.email !== fields.re_email){
            err = "Email address dont match."
        }

        setErrorTxt(err);

        if (err == "") {
            let val = {username:fields.username,password:fields.password}
            SetID(val);
            //navigation.navigate("BT_conn");
        }
    }

    return (
        <View>
            <TextInput placeholder="username" onChangeText={(value) => { userCtx.dispatch({ type: "username", value }) }} />
            <TextInput placeholder="password" secureTextEntry={true} onChangeText={(value) => { userCtx.dispatch({ type: "password", value }) }} />
            <TextInput placeholder="validate password" secureTextEntry={true} onChangeText={(value) => { userCtx.dispatch({ type: "re_password", value }) }} />
            <TextInput placeholder="email" onChangeText ={(value)=>{userCtx.dispatch({type:"email",value})}}/>
            <TextInput placeholder="validate email" onChangeText ={(value)=>{userCtx.dispatch({type:"re_email",value})}}/>

            {/* <TextInput placeholder="MAT code" onChangeText={(value) => {userCtx.dispatch({ type: "mat_code", value }) }} /> */}

            <ShakingText style={styles.error}>{error_txt}</ShakingText>
            <Text>{JSON.stringify(userCtx.state)}</Text>
            <Button title="Verify" onPress={VerifyForm} />
        </View>
    )

}

const styles = StyleSheet.create({
    error: {
        color: "red",
        fontWeight: "bold",
    }
})