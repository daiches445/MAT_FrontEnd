import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, ToastAndroid, Pressable, Dimensions } from 'react-native';
import { BleManager, Device, Service } from 'react-native-ble-plx';
import { Button } from 'react-native-paper';
import { manager } from '../../App';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import base64 from 'react-native-base64';
import SignUpBiometric from './SignUpBiometric'
import { BLEcontext } from '../../App';
import FontistoIcon from 'react-native-vector-icons/Fontisto';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { AUTH_SERVICE } from '../ServicesAndCharacteristics';

import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';

import Header from './Header';
import Form from './Form';
import Footer from './Footer';

const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const SCAN_TRANSACTION = "scan_transaction"

export default function Login({ navigation }) {


    const scan_start = new Date();
    const BLECtx = useContext(BLEcontext);

    const [username, setUsername] = useState("init_user")
    const [password, setPassword] = useState("init_pass")
    const [BTstate, setBtstate] = useState();
    const [biometricVisibility, setBiometricVisibilty] = useState(false);
    const [manager_status, setMangerStatus] = useState('idle');
    const [is_device_connected, setIs_device_connected] = useState(false);

    //const [biometric_signup, setBiometricSignup] = useState({ res: null, value: "" });
    //const [services, setServices] = useState([new Service()]);
    //const [device, setDevice] = useState();




    useEffect(async () => {
        if (!manager) {
            manager = new BleManager();
        }
        manager.state()
            .then((state) => {
                setBtstate(state);

                if (state === "PoweredOn") {
                    ScanAndConnect();
                }
            }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })



    }, [])

    useEffect(() => {
        const state_subscription = manager.onStateChange((state) => {
            setBtstate(state);
            manager.stopDeviceScan();
            setMangerStatus("idle");

            if (state === "PoweredOn")
                ScanAndConnect();

        });


        return () => state_subscription.remove();
    }, [manager]);


    async function ScanAndConnect() {
        let scan_end;
        setMangerStatus('scanning');

        manager.startDeviceScan([AUTH_SERVICE], { allowDuplicates: false }, (error, device) => {
            scan_end = new Date();
            console.log("scanning");
            var timeDiff = scan_end - scan_start;
            timeDiff /= 1000;
            var seconds = Math.round(timeDiff);

            if (seconds > 3) {
                manager.stopDeviceScan();
            }

            if (error) {
                console.log('ScanAndConnect error ============' + error.message);
                manager.stopDeviceScan();
                setMangerStatus('idle');
            }

            if (device.name === "MAT") {
                //setDevice(device)
                manager.stopDeviceScan();
                ConnectToDevice(device.id)
            }

        });

    }

    async function ConnectToDevice(id) {

        console.log('connecting..');
        await manager.connectToDevice(id, { autoConnect: true })
            .then((d) => {
                (async () => {
                    setMangerStatus('connected');
                    console.log("discover services....");
                    d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)
                    const serv = await manager.servicesForDevice(id)
                    
                    //setDevice(d);
                    //setServices(serv);

                    BLECtx.dispatch({ type: 'device', value: d })
                    BLECtx.dispatch({ type: 'services', value: serv })
                    setIs_device_connected(true);

                    const disconnect_subscription = manager.onDeviceDisconnected(d.id, (err, device) => {
                        console.log("disconnect event ");
                        setMangerStatus('idle')
                        setIs_device_connected(false);
                        disconnect_subscription.remove();
                    })

                    //console.log("serv 2 ==== ", serv[2]);

                })().catch((err) => { console.log("CATCH DISCOVER SERVICES =========== " + err); });
            })
            .catch((err) => {
                setMangerStatus('idle');
                console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err))
            })
    }

    async function SignInUserData() {

        let response;
        let char_uuid = "a0b10004-e8f2-537e-4f6c-d104768a1214";
        let auth_service_uuid = AUTH_SERVICE;
        let auth_service = BLECtx.state.services.find(s => s.uuid === auth_service_uuid)
        let device = BLECtx.state.device;

        if (auth_service === undefined) {
            console.log("SignInUserData func === AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {

                let data = {
                    "username": username,
                    "password": password
                }
                console.log("DATA TO SEND =====", JSON.stringify(data));
                let msg = encoder.encode(JSON.stringify(data));
                let user_data_char = res.find(c => c.uuid === char_uuid);


                device.writeCharacteristicWithResponseForService(auth_service.uuid, user_data_char.uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {

                        user_data_char.read().then(res => {
                            response = base64.decode(res.value);
                            console.log("user_data_char.read()=====", response);
                        }).finally(() => {
                            if (response === "true") {
                                console.log("LOGIN SUCCESS");
                                navigation.navigate('Main');
                            }
                            else {
                                console.log(response, " INCORRECT");
                                return false;
                            }
                        })

                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });
                //setCharacteristics(res)

            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });

        return false;
    }

    function Disconnect() {

        let dev = BLECtx.state.device;
        if (dev !== undefined) {

            try {
                dev.cancelConnection().then(dev=>{
                    setIs_device_connected(false);
                    setMangerStatus('idle');
    
                }).catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })

            } catch (error) {
                console.log("CATCH dissconect error =======" + JSON.stringify(error));
            }
        }
    }



    return (
        <View style={styles.container}>
            <Header />
            <Form setUsername={setUsername} setPassword={setPassword} />
            <View style={styles.btns_cont}>
                <Button
                    color="black"
                    mode="text"
                    loading={manager_status == "scanning"}
                    style={styles.login_btn}
                    labelStyle={styles.label_login_btn}
                    disabled={manager_status == "scanning" || BTstate == "PoweredOff"}
                    onPress={is_device_connected ? SignInUserData : ScanAndConnect} >
                    <Text style>{manager_status == "scanning" ? "SCANNING" : is_device_connected ? "LOGIN" : "SCAN"}</Text>
                </Button>
                <SignUpBiometric
                    connected={is_device_connected}
                    //SignUp={RegisterBiometric}
                    //signUpValue={biometric_signup}
                    username= {{username,setUsername}}
                    password = {{password,setPassword}}
                    navigate2main={() => { navigation.navigate("Main") }}
                    visibility={biometricVisibility}
                    setVisibilty={setBiometricVisibilty} />

                <Button
                    mode={BTstate == "PoweredOn" ? "text" : "outlined"}
                    disabled={BTstate == "PoweredOn"}
                    labelStyle={styles.no_bt_err_txt}
                    style={styles.no_bt_err_btn}
                    onPress={() => { manager.enable() }}
                >
                    {BTstate == "PoweredOn" ? "" : "Turn Bluetooth ON."}</Button>
            </View>


            <Button onPress={Disconnect}>disconnect</Button>
            <Button onPress={() => { navigation.navigate("Register") }} >Join MAT</Button>

            <Footer />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: windowWidth,
        height: windowHeight,
        alignSelf: "center",
        justifyContent: "space-between",
        fontFamily: fonts.TITLE_big_noodle_titling

    },
    login_btn: {
        borderWidth: 2,
        borderColor: colors.light_black,
        width: windowWidth * 0.6,
        justifyContent: "center"
    },
    label_login_btn: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 30,
    },
    btns_cont: {
        width: windowWidth * 0.8,
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap"
    },
    no_bt_err_txt: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        color: "red",
    },
    no_bt_err_btn: {
        color: "red",
        marginTop: 3
    }

})

// async function RegisterBiometric(data) {

//     let response;
//     let char_uuid = "a0b10005-e8f2-537e-4f6c-d104768a1214";
//     let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
//     let auth_service = services.find(s => s.uuid === auth_service_uuid)

//     if (auth_service === undefined) {
//         console.log("RegisterBiometric func == AUTH SERVICE UNDEFINED");
//         return;
//     }

//     await auth_service.characteristics().then(
//         res => {

//             let msg = encoder.encode(JSON.stringify(data));
//             let user_data_char = res.find(c => c.uuid === char_uuid);

//             device.writeCharacteristicWithResponseForService(auth_service.uuid, user_data_char.uuid, Buffer.from(msg).toString('base64'))
//                 .then(res => {

//                     user_data_char.read().then(res => {
//                         response = base64.decode(res.value);
//                         console.log("user_data_char.read()=====", response);
//                     }).finally(() => {

//                         console.log("LOG FORM FINALLY AFTER READ", response);

//                         if (response === "true") {
//                             console.log("LOGIN SUCCESS");
//                             setBiometricSignup({ res: true, value: "" })
//                         }
//                         else {
//                             console.log(response, " INCORRECT");
//                             setBiometricSignup({ res: false, value: response });
//                         }

//                     })

//                 }).catch(err => {
//                     setBiometricSignup({ res: false, value: "CATCH WRITE DATE" });
//                     console.log("CATCH WRITE DATE  ", err);
//                 });
//             //setCharacteristics(res)

//         }).catch(err => {
//             setBiometricSignup({ res: false, value: err });
//             console.log("CATCH CHARS ERR ======== ", err)
//         });


// }


// const IsDeviceConnected = async () => {
//     if (!device) {
//         {
//             await manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
//                 .then(res => {
//                     if (res[0]) {
//                         (async () => {
//                             const services = await manager.servicesForDevice(res[0].id)
//                             BLECtx.dispatch({ type: "device", value: res[0] })
//                             BLECtx.dispatch({ type: "services", value: services })
//                         })
//                     }
//                 }).catch(err => { console.log("CATCH ERR FROM IsDeviceConnected ===", err); })
//         }
//     }
// }
//IsDeviceConnected();