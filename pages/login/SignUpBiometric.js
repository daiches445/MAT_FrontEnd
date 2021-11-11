import React, { useEffect, useState } from 'react'
import { View, Text, ToastAndroid, Button, StyleSheet } from 'react-native'
import FingerprintScanner from 'react-native-fingerprint-scanner';
import Dialog from "react-native-dialog";
import * as Keychain from 'react-native-keychain';
import ShakeText from "react-native-shake-text";
import Ionicons from 'react-native-vector-icons/Ionicons';

import * as colors from '../../styles/colors';

export default function SignUpBiometric(props) {

    const [username, setUsername] = useState('init_user');
    const [password, setPassword] = useState('init_pass');
    const [err_msg, setErrMsg] = useState('');
    const [credentials, setCredentials] = useState();

    useEffect(() => {
        const GetUserData = async () => {
            const credentials = await Keychain.getGenericPassword();
            setCredentials(credentials);
        }
        GetUserData();


        if(credentials){
            FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
            .then(() => {
                console.log("cred", credentials);
            }).catch(err => { console.log(err) })
        }
        
        setErrMsg('');
        return () => {
            console.log('cleanup');
        }
    }, [])


    useEffect(async () => {
        const fingerprint_auth = async () => {
            let response = props.signUpValue;
            console.log("VALUE FROM BIOMETRIC USE EFFECT ", response);

            if (response.res === null)
                return;

            if (response.res) {
                setErrMsg('');
                FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
                    .then(() => {
                        SetKeychain().then(res => {
                            return props.setVisibilty(false);

                        }).catch(err => { console.log("CATCH ERR SET KEYCHAIN ====", err); })
                    }).catch(err => { console.log(err) })
            }
            let msg = "invalid " + response.value;
            setErrMsg(msg);
        }
        fingerprint_auth();
    }, [props.signUpValue])



    async function BiometricAccess() {
        setErrMsg('');
        props.SignUp({ username, password })

    }

    async function SetKeychain() {
        return await Keychain.setGenericPassword(username, password, { accessControl: 'BiometryCurrentSetOrDevicePasscode', })
    }

    const handlePress = () => {
        if (credentials) {
            FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
                .then(() => {
                    console.log("cred", credentials);
                }).catch(err => { console.log(err) })
        }
        else {
            props.setVisibilty(!props.visibility);
        }
    }


    return (
        <View>
            <Ionicons.Button 
                iconStyle={{left:4}}
                style={styles.biometric_btn}
                name="finger-print"
                size={40}
                onPress={handlePress}
            />
            {props.connected ? (<Dialog.Container contentStyle={{ margin: 10 }} visible={props.visibility}>
                <Dialog.Title>Add Fingerprint</Dialog.Title>
                <Dialog.Description>Enter your user details </Dialog.Description>
                <Dialog.Input maxLength={20} label="Username" onChangeText={setUsername} />
                <Dialog.Input maxLength={20} label="Password" onChangeText={setPassword} />
                <ShakeText style={styles.err_txt}>{err_msg}</ShakeText>
                <Dialog.Button label="Send" onPress={BiometricAccess} />
                <Dialog.Button label="Cancel" onPress={() => { props.setVisibilty(false) }} />
            </Dialog.Container>)
                :
                (<Dialog.Container contentStyle={{ margin: 10 }} visible={props.visibility}>
                    <Dialog.Title>MAT unavilable</Dialog.Title>
                    <Ionicons style={styles.bt_logo} size={60} name="bluetooth" />
                    <Dialog.Description>Please connect to MAT device</Dialog.Description>
                    <Dialog.Button label="Close" onPress={() => { props.setVisibilty(false) }} />
                </Dialog.Container>)}

        </View>
    )

}

const styles = StyleSheet.create({
    err_txt: {
        color: 'red'
    },
    biometric_btn: {
        borderColor:colors.light_black,
        borderWidth:2,

    },
    bt_logo: {
        alignSelf: "center"
    }
})