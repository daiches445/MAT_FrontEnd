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

import { AUTH_SERVICE, USEDATA_LOGIN_CHAR } from '../ServicesAndCharacteristics';

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

    const BLECtx = useContext(BLEcontext);

    const [username, setUsername] = useState("init_user")
    const [password, setPassword] = useState("init_pass")
    const [BTstate, setBtstate] = useState();
    const [biometricVisibility, setBiometricVisibilty] = useState(false);
    const [manager_status, setMangerStatus] = useState('idle');
    const [is_device_connected, setIs_device_connected] = useState(false);
    const [err_text,setErrText] = useState('');

    //const [biometric_signup, setBiometricSignup] = useState({ res: null, value: "" });
    //const [services, setServices] = useState([new Service()]);
    //const [device, setDevice] = useState();



    useEffect(async () => {
        if (!manager) {
            manager = new BleManager();
        }
        //await ConnectedDevices();
        manager.state()
            .then((state) => {
                setBtstate(state);

            }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })

        return () => {
            manager.stopDeviceScan()
        }

    }, [])

    useEffect(() => {
        const state_subscription = manager.onStateChange((state) => {
            setBtstate(state);
            manager.stopDeviceScan();
            setMangerStatus("idle");

        });

        return () => {
            console.log("Login unmount ");
            setMangerStatus('idle')
            state_subscription.remove();
        }
    }, [manager]);


    async function ScanAndConnect() {

        setMangerStatus('scanning');//keep track of manager status

        //call the BLE manager to start device scan ,AUTH_SERVICE parameter = uuid of a service on MAT device.
        manager.startDeviceScan([AUTH_SERVICE], { allowDuplicates: false }, (error, device) => {


            if (error) {
                console.log('ScanAndConnect error ============' + error.message);
                manager.stopDeviceScan();
                setMangerStatus('idle');
            }

            //connect to device w
            if (device.name === "MAT") {
                manager.stopDeviceScan();//if device found stop device scan
                ConnectToDevice(device.id);//move to device connection
            }

        });

    }

    async function ConnectToDevice(id) {

        console.log('connecting..');
        //async function connect to device with previusly found id  
        await manager.connectToDevice(id, { autoConnect: true })
            .then((d) => {//on success return a Promise with A connected device
                (async () => {
                    setMangerStatus('connected');//keep track of manager status
                    console.log("discover services....");
                    d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)//discover services and chars of device
                    const serv = await manager.servicesForDevice(id)//get all services of device

                    //setDevice(d);
                    //setServices(serv);

                    BLECtx.dispatch({ type: 'device', value: d })//set device on global state -- useReducer ;similar to Redux;
                    BLECtx.dispatch({ type: 'services', value: serv })//set services on global state -- useReducer ;similar to Redux;
                    setIs_device_connected(true);//notify components that device is connected.

                    //on device connection add subscription/event listner to notify on disconnection.
                    const disconnect_subscription = manager.onDeviceDisconnected(d.id, (err, device) => {
                        console.log("disconnect event ");
                        setMangerStatus('idle')//keep track of manager status
                        setIs_device_connected(false);//notify components that device has been disconnected
                        BLECtx.dispatch({ type: 'logout' });
                        disconnect_subscription.remove();//remove event listner when disconnect.
                    })

                    //console.log("serv 2 ==== ", serv[2]);

                })().catch((err) => {
                    console.log("CATCH DISCOVER SERVICES =========== " + err);
                });//error notify
            })
            .catch((err) => {
                setMangerStatus('idle');
                console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err))
            })//error notify
    }

    async function SignInUserData() {

        setErrText("");
        //search for pre-defined BLE service from Services array
        let auth_service = BLECtx.state.services.find(s => s.uuid === AUTH_SERVICE)
        //set MAT device on scope variable
        let device = BLECtx.state.device;

        //error handling
        if (auth_service === undefined) {
            console.log("SignInUserData func === AUTH SERVICE UNDEFINED");
            return;
        }

        //discover Service Characteristics
        await auth_service.characteristics().then(
            res => {

                let data = {
                    "username": username,
                    "password": password
                }

                console.log("DATA TO SEND =====", JSON.stringify(data));
                //encode user details to Uint8Array 
                let msg = encoder.encode(JSON.stringify(data));
                //scan the discoverd Characteristics array for a specific Characteristic using UUID
                let user_data_char = res.find(c => c.uuid === USEDATA_LOGIN_CHAR);//

                //send user details to MAT via discoverd Characteristic
                device.writeCharacteristicWithResponseForService(
                    auth_service.uuid,
                    user_data_char.uuid,
                    Buffer.from(msg).toString('base64'))//using a buffer to send and convert Uint8Array to base64 encoding 
                    .then(res => {
                        let value;
                        //reading MAT response
                        user_data_char.read().then(res => {
                            value = base64.decode(res.value);// decoding the result
                            console.log("user_data_char.read()=====", value);
                        }).finally(() => { //the 'finally' step is critical in order
                                            // to process the result after its arrivel and not before.
                            console.log("finally -  value",value);
                            if (value === "true") {
                                console.log("LOGIN SUCCESS");
                                navigation.navigate('Main');//navigate to main if data is correct
                            }
                            else if(value === "unregisterd"){
                                console.log("NO registerd");
                            }
                            else {
                                console.log(value, " INCORRECT");
                                setErrText("login failed, enter valid details.")
                                //return false;
                            }
                        })

                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });
                //setCharacteristics(res)

            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });

        return false;
    }

    async function ConnectedDevices(){

        console.log('ConnectedDevices');
        await manager.connectedDevices([AUTH_SERVICE]).then(devices=>{
            console.log('devices',devices);
            devices.forEach(d=>{
                console.log(d);
                if(d.name =="MAT")
                    BLECtx.dispatch({type:'device',value:d})
            })
        })

    }

    function Disconnect() {


            try {
                let id = BLECtx.state.device.id;
                manager.cancelDeviceConnection(id).then(dev => {
                    setIs_device_connected(false);
                    setMangerStatus('idle');

                }).catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })

            } catch (error) {
                console.log("CATCH dissconect error =======" + JSON.stringify(error));
            }
    }



    return (
        <View style={styles.container}>
            {console.log(manager_status)}
            <Header />
            <Form setUsername={setUsername} setPassword={setPassword} err_text={err_text} />
            <View style={styles.btns_cont}>
                <Button
                    color="black"
                    mode="text"
                    loading={manager_status == "scanning"}
                    style={styles.login_btn}
                    labelStyle={styles.label_login_btn}
                    disabled={manager_status == "scanning" || BTstate == "PoweredOff"}
                    onPress={is_device_connected ? SignInUserData : ScanAndConnect}
                    //onPress={() => { navigation.navigate("Main") }}
                >
                    <Text style>{manager_status == "scanning" ? "SCANNING" : is_device_connected ? "LOGIN" : "SCAN"}</Text>
                </Button>
                <SignUpBiometric
                    connected={is_device_connected}
                    //SignUp={RegisterBiometric}
                    //signUpValue={biometric_signup}
                    username={{ username, setUsername }}
                    password={{ password, setPassword }}
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