import React, { useContext, useEffect, useState, useRef } from 'react'
import { Animated, View, Text, ToastAndroid, ActivityIndicator, StyleSheet } from 'react-native'
import Dialog from "react-native-dialog";
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as colors from '../../styles/colors';

import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import base64 from 'react-native-base64';

import FingerprintScanner from 'react-native-fingerprint-scanner';
import * as Keychain from 'react-native-keychain';

import { BLEcontext } from '../../App';

import { AUTH_SERVICE, USEDATA_LOGIN_CHAR } from '../ServicesAndCharacteristics';

const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();


export default function SignUpBiometric(props) {

    const shake_text_ref = useRef(new Animated.Value(0)).current;
    const opacity_text_ref = useRef(new Animated.Value(0)).current;

    const BLEctx = useContext(BLEcontext);
    const [username, setUsername] = useState('init_user');
    const [password, setPassword] = useState('init_pass');
    const [err_msg, setErrMsg] = useState('');
    const [credentials, setCredentials] = useState();
    const [loading, setLoading] = useState(false);

    useEffect(async () => {
        await Keychain.resetGenericPassword();
        const GetUserData = async () => {
            const credentials = await Keychain.getGenericPassword();
            setCredentials(credentials);
        }
        await GetUserData();

        setErrMsg('');
        return () => {
            console.log('cleanup');
        }
    }, [])

    useEffect(async () => {
        if (props.connected) {
            if (credentials) {
                BiometricAccess();
            }
        }
    }, [props.connected])

    function AnimateErrorText() {

        shake_text_ref.setValue(0);
        Animated.parallel([
            Animated.spring(shake_text_ref, {
                damping: 10,
                useNativeDriver: true,
                toValue: 10
            }),
            Animated.spring(opacity_text_ref, {
                speed: 100,
                useNativeDriver: true,
                toValue: 1
            })
        ]).start();
    }


    async function BiometricAccess() {
        console.log("BiometricAccess start");
        FingerprintScanner.release();
        FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
            .then(async () => {
                console.log("BiometricAccess FingerprintScanner");
                setPassword(credentials.username);
                setPassword(credentials.password);
                SignIn()
            }).
            catch(err => {
                console.log("FingerprintScanner CATCH ", err)
            })

        console.log("BiometricAccess end");
    }

    async function SetKeychain() {
        setLoading(true);
        FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue'})
            .then(async () => {
                await Keychain.setGenericPassword(username, password, { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE })
                    .then(res => {
                        if (res) {
                            ToastAndroid.show("Biometric access achived.", ToastAndroid.LONG);
                            setLoading(false);
                            props.navigate2main();
                        }
                        else
                            setErrMsg("Unable to register user details.")
                        AnimateErrorText();
                    })
            }).catch(err => {
                console.log(err)
            })
    }

    async function SignIn(user_data) {

        let device = BLEctx.state.device;
        let response;
        let char_uuid = USEDATA_LOGIN_CHAR;
        let auth_service_uuid = AUTH_SERVICE;
        let auth_service = BLEctx.state.services.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("RegisterBiometric func == AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {
                let msg = encoder.encode(JSON.stringify({ username, password }));
                let user_data_char = res.find(c => c.uuid === char_uuid);

                device.writeCharacteristicWithResponseForService(auth_service.uuid, user_data_char.uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {

                        user_data_char.read().then(res => {
                            response = base64.decode(res.value);
                            console.log("user_data_char.read()=====", response);
                        }).finally(async () => {
                            console.log("LOG FORM FINALLY AFTER READ", response);

                            if (response === "true") {
                                if (!credentials) {
                                    await SetKeychain();
                                }
                                else {
                                    props.navigate2main();
                                }
                            }
                            else {
                                setErrMsg("Invalid user details.");
                                AnimateErrorText();
                                console.log(response, " INCORRECT");
                            }
                        })

                    }).catch(err => {
                        //setBiometricSignup({ res: false, value: "CATCH WRITE DATE" });
                        console.log("CATCH WRITE DATE  ", err);
                    });
                //setCharacteristics(res)

            }).catch(err => {
                //setBiometricSignup({ res: false, value: err });
                console.log("CATCH CHARS ERR ======== ", err)
            });


    }



    async function handlePress() {

        if (!props.connected) {
            props.setVisibilty(true)
            return;
        }
        if (credentials) {
            await FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
                .then(() => {
                    BiometricAccess();
                }).catch(err => { console.log(err) })
        }
        else {
            props.setVisibilty(true);
        }
    }

    return (
        <View style={{}}>
            <Ionicons.Button
                iconStyle={{ left: 4 }}
                style={styles.biometric_btn}
                name="finger-print"
                size={40}
                onPress={handlePress}
            />
            {props.connected ? (
                loading ? (
                    <Dialog.Container>
                        <Dialog.Title>loading</Dialog.Title>
                    </Dialog.Container>
                ) :
                    <Dialog.Container contentStyle={{ margin: 10 }} visible={props.visibility}>
                        <Dialog.Title>Add Fingerprint</Dialog.Title>
                        <Dialog.Description>Enter your user details </Dialog.Description>
                        <Dialog.Input maxLength={20} label="Username" onChangeText={setUsername} />
                        <Dialog.Input maxLength={20} label="Password" onChangeText={setPassword} />
                        <Animated.Text style={{ color: "red", opacity: opacity_text_ref, transform: [{ translateX: shake_text_ref }] }}>{err_msg}</Animated.Text>
                        <Dialog.Button label="Send" onPress={SignIn} />
                        <Dialog.Button label="Cancel" onPress={() => { props.setVisibilty(false) }} />
                    </Dialog.Container>)
                :
                (<Dialog.Container contentStyle={{ margin: 10 }} visible={props.visibility}>
                    <Dialog.Title>MAT unavilable</Dialog.Title>
                    <Ionicons style={styles.bt_logo} size={60} name="bluetooth" />
                    <Dialog.Description>Please connect to MAT device</Dialog.Description>
                    <Dialog.Button label="Close" onPress={() => { props.setVisibilty(false) }} />
                </Dialog.Container>)
            }

        </View>
    )

}

const styles = StyleSheet.create({

    biometric_btn: {
        borderColor: colors.light_black,
        borderWidth: 2,
    },
    bt_logo: {
        alignSelf: "center"
    }
})