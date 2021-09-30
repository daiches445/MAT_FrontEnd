import React, { useEffect, useState } from 'react'
import { View, Text, ToastAndroid, Button, StyleSheet } from 'react-native'
import FingerprintScanner from 'react-native-fingerprint-scanner';
import Dialog from "react-native-dialog";
import * as Keychain from 'react-native-keychain';
import ShakingText from 'react-native-shaking-text';

export default function SignUpBiometric(props) {
    
    const [username, setUsername] = useState('init_user');
    const [password, setPassword] = useState('init_pass');
    const [err_msg, setErrMsg] = useState('invalid');

    
    async function BiometricAccess() {
        console.log("BIOMETRIC ACCESS FUNCTION ====");
        let response = await props.SignUp({ username, password });

        if (response.res) {
            setErrMsg('');
            FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
                .then(() => {
                    SetKeychain().then(res => {
                        console.log(res);
                        return props.setVisibilty(false);
                    }).catch(err => { console.log("CATCH ERR SET KEYCHAIN ====", err); })
                }).catch(err => { console.log(err) })
        }
        let msg = "invalid" + res.value;
        setErrMsg(msg);

    }

    async function SetKeychain() {
        return await Keychain.setGenericPassword(username, password, { accessControl: 'BiometryCurrentSetOrDevicePasscode', })
    }

    return (
        <View>
            <Button title="Biometric login " onPress={() => { props.setVisibilty(!props.visibility) }} />
            <Dialog.Container contentStyle={{ margin: 10 }} useNativeDriver={true} visible={props.visibility}>
                <Dialog.Title>Add Fingerprint</Dialog.Title>
                <Dialog.Description>Enter your user details </Dialog.Description>
                <Dialog.Input maxLength={20} label="Username" onChangeText={setUsername} />
                <Dialog.Input maxLength={20} label="Password" onChangeText={setPassword} />
                <ShakingText style={styles.err_txt}>{err_msg}</ShakingText>

                <Dialog.Button label="Send" onPress={() => { err_msg === "" ? BiometricAccess() : setErrMsg(err_msg) }} />
                <Dialog.Button label="Cancel" onPress={() => { props.setVisibilty(false) }} />
            </Dialog.Container>
        </View>
    )
}

const styles = StyleSheet.create({
    err_txt: {
        color: 'red'
    }
})