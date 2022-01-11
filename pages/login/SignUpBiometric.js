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

    //consts using useRef hook with an Animated value for error text animation.
    const shake_text_ref = useRef(new Animated.Value(0)).current;
    const opacity_text_ref = useRef(new Animated.Value(0)).current;

    //getting the global state - simillar to Redux
    const BLEctx = useContext(BLEcontext);

    const [username, setUsername] = useState('init_user');
    const [password, setPassword] = useState('init_pass');
    const [err_msg, setErrMsg] = useState('');
    //pre saved user credentials if fingerprint was registerd
    const [credentials, setCredentials] = useState();
    const [loading, setLoading] = useState(false);

    //useEffect function to run once on component mount - one time only.
    useEffect(async () => {
        //await Keychain.resetGenericPassword();

        //check if user has registerd a fingerprint.
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

    //useEffect with a prop dependency - will run when on prop update.
    useEffect(async () => {
        //when device has been recognized and connected on parent component
        //check if user has credentails and call biometric pop-up
        if (props.connected) {
            if (credentials) {
                BiometricAccess();
            }
        }
    }, [props.connected])

    function AnimateErrorText() {
        //create a shake effect on text error component when login failed.

        //reset initial value.                               
        shake_text_ref.setValue(0);

        //call two Animations together
        Animated.parallel([
            //a 'spring' type animation that will change graduatlly the value to new one.
            //also define the spring behiavior by the using the 'damping' setting
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
        //this function calls the fingerprint scanner popup
        console.log("BiometricAccess start");


        FingerprintScanner.release();
        await FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
            .then(async () => {
                
                //if fingerprint is correct - get the username and password from the pre saved credentials.
                console.log("BiometricAccess FingerprintScanner");
                setUsername(credentials.username);
                setPassword(credentials.password);
                SignIn()
            }).
            catch(err => {
                console.log("FingerprintScanner CATCH ", err)
            })

        console.log("BiometricAccess end");
    }

    async function SetKeychain() {

        FingerprintScanner.authenticate({ description: 'Scan your fingerprint on the device scanner to continue' })
            .then(async () => {
                setLoading(true);
                await Keychain.setGenericPassword(username, password,
                    { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE })
                    .then(res => {
                        if (res) {
                            Promise.resolve();
                        } else {
                            setErrMsg("Unable to register user details.")
                            AnimateErrorText();
                            Promise.reject("keychain error")
                        }
                    }).then(() => {
                        ToastAndroid.show("Biometric access granted.", ToastAndroid.LONG);
                        setLoading(false);
                        props.navigate2main();
                    }).catch(err => {
                        console.log(err);
                    })
            })


    }

    async function SignIn(user_data) {
        //let response;

        //set MAT device on scope variable
        let device = BLEctx.state.device;
        //search for pre-defined BLE service from Services array
        let auth_service = BLEctx.state.services.find(s => s.uuid === AUTH_SERVICE)

        //error handling
        if (auth_service === undefined) {
            console.log("RegisterBiometric func == AUTH SERVICE UNDEFINED");
            return;
        }

        //discover Service Characteristics
        await auth_service.characteristics().then(
            res => {

                //encode user details to Uint8Array 
                let msg = encoder.encode(JSON.stringify({ username, password }));
                //scan the discoverd Characteristics array for a specific Characteristic using UUID                
                let user_data_char = res.find(c => c.uuid === USEDATA_LOGIN_CHAR);

                //send user details to MAT via discoverd Characteristic
                device.writeCharacteristicWithResponseForService(
                    auth_service.uuid,
                    user_data_char.uuid,
                    Buffer.from(msg).toString('base64'))//using a buffer to send and convert Uint8Array to base64 encoding
                    .then(res => {
                        let val;
                        //reading MAT response
                        user_data_char.read().then(res => {
                            val= base64.decode(res.value);// decoding the result
                            console.log("user_data_char.read()=====", val);
                        }).finally(async () => {//the 'finally' step is critical in order
                                                    // to process the result after its arrivel and not before.

                            console.log("LOG FORM FINALLY AFTER READ", val);

                            if (val === "true") {//if the user details are correct

                                if (!credentials) {      //if user DONT have a registerd fingerprint
                                    
                                    await SetKeychain();//then call the function that will handle the registration
                                }
                                else {//if user HAS a registerd fingerprint
                                    props.navigate2main();
                                }
                            }
                            else if (val == "unregisterd") {//if MAT hasnt been activated 
                                setErrMsg("Unregisterd device.");
                            }
                            else {
                                setErrMsg("Invalid user details.");//if user details are incorrect
                                console.log(val, " INCORRECT");
                            }
                            AnimateErrorText();

                        })

                    }).catch(err => {
                        console.log("CATCH WRITE DATE  ", err);
                    });

            }).catch(err => {
                console.log("CATCH CHARS ERR ======== ", err)
            });


    }



    async function handlePress() {
        //handle the 'fingerprint' button press


        //if a device is not connected OR the user dont hav ebiometric crednetials
        //the show pop-up.(if a device isnt connected a differnt dialog will be shown)
        FingerprintScanner.release();
        if (!props.connected || !credentials) {
            props.setVisibilty(true)
        }
        else if (credentials) {//if user has biometric credintials the call the the finger print pop-up
            BiometricAccess();//call the fingerprint prompt
        }

    }

    return (
        <View style={{}}>
            <Ionicons.Button //'Fingerprint' button
                iconStyle={{ left: 4 }}
                style={styles.biometric_btn}
                name="finger-print"
                size={40}
                disabled = {!props.connected}
                onPress={handlePress}
            />
            {props.connected ? (//if MAT is connected
                loading ? (//when setting a new Keychain credentials
                    <Dialog.Container>
                        <Dialog.Title>please wait</Dialog.Title>
                        <ActivityIndicator animating={loading} />
                    </Dialog.Container>
                ) ://Main dialog for registration
                    <Dialog.Container contentStyle={{ margin: 10 }} visible={props.visibility}>
                        <Dialog.Title>Add Fingerprint</Dialog.Title>
                        <Dialog.Description>Enter your user details </Dialog.Description>
                        <Dialog.Input maxLength={20} label="Username" onChangeText={setUsername} />
                        <Dialog.Input maxLength={20} label="Password" onChangeText={setPassword} />
                        <Animated.Text style={{ color: "red", opacity: opacity_text_ref, transform: [{ translateX: shake_text_ref }] }}>{err_msg}</Animated.Text>
                        <Dialog.Button label="Send" onPress={SignIn} />
                        <Dialog.Button label="Cancel" onPress={() => { props.setVisibilty(false) }} />
                    </Dialog.Container>)
                ://if MAT isnt connect when user presses on the 'Fingerprint' button.
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