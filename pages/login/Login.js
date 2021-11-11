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

import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';

import Header from './Header';
import Form from './Form';
import Footer from './Footer';

const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function Login({ navigation }) {


    const scan_start = new Date();
    const BLECtx = useContext(BLEcontext);
    const [username, setUsername] = useState("init_user")
    const [password, setPassword] = useState("init_pass")
    const [device, setDevice] = useState();
    const [BTstate, setBtstate] = useState();
    const [services, setServices] = useState([new Service()]);
    const [biometricVisibility, setBiometricVisibilty] = useState(false);
    const [biometric_signup, setBiometricSignup] = useState({ res: null, value: "" });
    const [manager_status, setMangerStatus] = useState('idle');



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

        const IsDeviceConnected = async () => {
            if (!device) {
                {
                    await manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
                        .then(res => {
                            if (res[0]) {
                                (async () => {
                                    const services = await manager.servicesForDevice(res[0].id)
                                    BLECtx.dispatch({ type: "device", value: res[0] })
                                    BLECtx.dispatch({ type: "services", value: services })
                                })
                            }
                        }).catch(err => { console.log("CATCH ERR FROM IsDeviceConnected ===", err); })
                }
            }
        }
        //IsDeviceConnected();


    }, [])

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBtstate(state);

            manager.stopDeviceScan();
            setMangerStatus("idle");

            if (state === "PoweredOn") {
                ScanAndConnect();
            }

        });
        return () => subscription.remove();
    }, [manager]);


    async function ScanAndConnect() {
        let scan_end;
        setMangerStatus('scanning');

        manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
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
                setDevice(device)
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
                    setDevice(d);
                    setServices(serv);
                    BLECtx.dispatch({ type: 'device', value: d })
                    BLECtx.dispatch({ type: 'services', value: serv })

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
        let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
        let auth_service = services.find(s => s.uuid === auth_service_uuid)

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

    async function RegisterBiometric(data) {

        let response;
        let return_value;
        let char_uuid = "a0b10005-e8f2-537e-4f6c-d104768a1214";
        let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
        let auth_service = services.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("RegisterBiometric func == AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {

                let msg = encoder.encode(JSON.stringify(data));
                let user_data_char = res.find(c => c.uuid === char_uuid);

                device.writeCharacteristicWithResponseForService(auth_service.uuid, user_data_char.uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {

                        user_data_char.read().then(res => {
                            response = base64.decode(res.value);
                            console.log("user_data_char.read()=====", response);
                        }).finally(() => {

                            console.log("LOG FORM FINALLY AFTER READ", response);

                            if (response === "true") {
                                console.log("LOGIN SUCCESS");
                                setBiometricSignup({ res: true, value: "" })
                            }
                            else {
                                console.log(response, " INCORRECT");
                                setBiometricSignup({ res: false, value: response });
                            }

                        })

                    }).catch(err => {
                        setBiometricSignup({ res: false, value: "CATCH WRITE DATE" });
                        console.log("CATCH WRITE DATE  ", err);
                    });
                //setCharacteristics(res)

            }).catch(err => {
                setBiometricSignup({ res: false, value: "CATCH CHARS ERR" });
                console.log("CATCH CHARS ERR ======== ", err)
            });


    }

    function Disconnect() {
        console.log('disconect');

        if (device === undefined) {
            console.log("device undifined");
            return;
        }
        try {
            device.cancelConnection().catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })
            setMangerStatus('idle');

        } catch (error) {
            console.log("CATCH dissconect error =======" + JSON.stringify(error));
        }
    }



    return (
        <View style={styles.container}>
            <Header />
            <Form username={username} setUsername={setUsername} setPassword={setPassword} />
            <View style={styles.btns_cont}>
                <Button
                    color="white"
                    mode="text"
                    loading={manager_status == "scanning"}
                    style={styles.login_btn}
                    labelStyle={styles.label_login_btn}
                    disabled={manager_status !== "connected"}
                    onPress={SignInUserData} >
                    <Text>{manager_status == "scanning" ? "SCANNING" : "LOGIN"}</Text>
                </Button>
                <SignUpBiometric
                    connected={device !== undefined}
                    SignUp={RegisterBiometric}
                    signUpValue={biometric_signup}
                    visibility={biometricVisibility}
                    setVisibilty={setBiometricVisibilty} />

            </View>

            <Button onPress={Disconnect}>disconnect</Button>
            <Button onPress={() => { navigation.navigate("Register") }} >Join MAT</Button>

            <Text style={{ color: "red" }}>{BTstate == "PoweredOn" ? "" : "Turn Bluetooth ON."}</Text>
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
        justifyContent:"center"
    },
    label_login_btn: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 30,
    },
    btns_cont: {
        width: windowWidth * 0.8,
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "space-between"
    }

})
async function IsDeviceConnected() {

    // if (!device) {
    //     {
    //         await manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
    //             .then(res => {
    //                 if (res[0]) {
    //                     (async () => {
    //                         const services = await manager.servicesForDevice(res[0].id)
    //                         BLECtx.dispatch({ type: "device", value: res[0] })
    //                         BLECtx.dispatch({ type: "services", value: services })
    //                     })
    //                 } else {
    //                     return (<Text></Text>)
    //                 }
    //             }).catch(err => { console.log("CATCH ERR FROM IsDeviceConnected ===", err); })
    //     }
    // }

    if (manager_status == "connected") {
        return (
            <View>
                <Button title="disconnect" onPress={Disconnect} />
                <SignUpBiometric
                    SignUp={RegisterBiometric}
                    signUpValue={biometric_signup}
                    visibility={biometricVisibility}
                    setVisibilty={setBiometricVisibilty} />
            </View>
        )
    } else if (manager_status == "scanning") {
        return (<Text>scanning</Text>)
    } else {
        return (<Text>waiting for connect</Text>)
    }


}