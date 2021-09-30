import React, { useEffect, useState } from 'react'
import { View, Text, ToastAndroid, Button } from 'react-native'
import FingerprintScanner from 'react-native-fingerprint-scanner';
import Dialog from "react-native-dialog";
import * as Keychain from 'react-native-keychain';


export default function BiometricPopup(props) {



    async function DataValidation(){

        await Keychain.setGenericPassword(username,password,{accessControl:'BiometryCurrentSetOrDevicePasscode'});
        let cred = await Keychain.getGenericPassword().catch(err=>{console.log("Credentials Error",err)});
        console.log(cred);
    }

    return (
        <View>
            <Button title="Biometric login " onPress={() => { props.setBiometricVisibilty(!props.visibility) }} />
            <Dialog.Container useNativeDriver={true} visible={props.visibility}>
                <Dialog.Title>Fingerprint</Dialog.Title>

                <Dialog.Button label="Cancel" onPress={() => { props.setBiometricVisibilty(false) }} />
            </Dialog.Container>
        </View>
    )
}
