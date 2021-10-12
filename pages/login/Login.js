import React, { useEffect, useState, useContext } from 'react';
import { TextInput, StyleSheet, Text, View, ToastAndroid, Pressable, Dimensions } from 'react-native';
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
import * as Animatable from 'react-native-animatable';


const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function Login({ navigation }) {


    const test_date = new Date();
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
        console.log("USE EFFECT LOGIN ,STATE ===",BLECtx.state);
        manager.state().then((state) => {
            setBtstate(state); console.log("INIT STATE ==== ", state);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })

        await ScanAndConnect();

    }, [])

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBtstate(state);
            console.log("State Change ==== ", state);
        });
        return () => subscription.remove();
    }, [manager]);


    async function ScanAndConnect() {
        let scan_start = new Date();
        let scan_end;
        setMangerStatus('scanning');

        manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
            scan_end = new Date();
            console.log("scanning");

            if (error) {
                console.log('ScanAndConnect error ============' + error.message);
                manager.stopDeviceScan();
                setMangerStatus('idle');
                return error;
            }

            if (device.name === "MAT") {
                console.log("Device ID = " + device.id);
                // setDevice(device)
                manager.stopDeviceScan();
                ConnectToDevice(device.id)
                return device;
            }

            let diff = Math.round((scan_end - scan_start) / 1000)
            if (diff > 3) {
                setMangerStatus("idle");
                manager.stopDeviceScan();
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
                    // d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)
                    const serv = await manager.servicesForDevice(id)
                    setDevice(d);
                    setServices(serv);
                    BLECtx.dispatch({ type: 'device', value: device })
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
            console.log("AUTH SERVICE UNDEFINED");
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
                res.forEach(element => {
                    console.log(element.uuid);
                });
                let user_data_char = res.find(c => c.uuid === char_uuid);


                device.writeCharacteristicWithResponseForService(auth_service.uuid, user_data_char.uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {
                        console.log("Char IS Readable ==", user_data_char.isReadable);

                        user_data_char.read().then(res => {
                            response = base64.decode(res.value);
                            console.log("user_data_char.read()=====", response);
                        }).finally(() => {
                            console.log("LOG FORM FINALLY AFTER READ", response);
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
            console.log("AUTH SERVICE UNDEFINED");
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


        if (device === null) {
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

    async function IsDeviceConnected() {


        if (!device)
{        await manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
        .then(res=>{
            if(res[0]){
                (async ()=>{
                    const services = await manager.servicesForDevice(res[0].id)
                    BLECtx.dispatch({type:"device",value:res[0]})
                    BLECtx.dispatch({type:"services",value:services})
                })
            }else{
                return (<Text></Text>)
            }
        }).catch(err=>{console.log("CATCH ERR FROM IsDeviceConnected ===",err);})}

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

    return (
        <View style={styles.container}>
            <View style={styles.title_view}>
                <Text style={styles.title}>MAT</Text>
                <Text style={styles.secondery_title}>MAT</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: fonts.TITLE_big_noodle_titling }}>manger status == {manager_status}</Text>
                <EvilIcon.Button
                    style={{ alignSelf: "flex-end" }}
                    color="black"
                    name="redo"
                    size={20}
                    backgroundColor="rgba(255, 0, 0, 0)"
                    onPress={ScanAndConnect}
                ></EvilIcon.Button>
            </View>
            <Button title="Search For MAT" onPress={ScanAndConnect} > scan </Button>
            {/* <Animatable.View animation="fadeIn">
                {device ? <FontistoIcon.Button

                    name="motorcycle"
                    onPress={() => { ConnectToDevice(device.id) }}
                    style={{ margin: 10, fontSize: 30 }}
                >
                    {device.name}
                </FontistoIcon.Button>
                    : console.log("no mat dev avilable")}
            </Animatable.View> */}
            <View style={styles.inputs_cont}>
                <TextInput style={{ borderBottomColor: colors.light_black, borderBottomWidth: 6 }} maxLength={20} placeholder="username" onChangeText={setUsername} />
                <TextInput maxLength={20} secureTextEntry={true} placeholder="password" onChangeText={setPassword} />
            </View>

            <View style={styles.btns_cont}>
                <Button
                    color="white"
                    mode="outlined"
                    loading={manager_status == "scanning"}
                    style={{
                        flexGrow: 1,
                    }}
                    labelStyle={styles.login_btn}
                    disabled={(BLECtx.state.device?false:true )||(BTstate == "PoweredOn" ? false : true)}
                    onPress={SignInUserData} >
                    <Text>{manager_status == "scanning" ? "SCANNING" : "LOGIN"}</Text>
                </Button>
                <FontAwesome5.Button style={styles.biometric_btn}
                    name="fingerprint"
                    size={30}
                    color="black"
                    backgroundColor="transparent"
                    onPress ={Bi}
                    ></FontAwesome5.Button>

            </View>
            {IsDeviceConnected()}
            {/* <Button title="move to reg" onPress={() => { navigation.navigate("Register") }} />
            <Button title="move to home" onPress={() => { navigation.navigate("Main") }} /> */}


            <Text style={{ color: "red" }}>{BTstate == "PoweredOn" ? "" : "Turn Bluetooth ON."}</Text>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: windowWidth * 0.9,
        alignSelf: "center",
        alignContent: "flex-end",
        fontFamily: fonts.TITLE_big_noodle_titling

    },
    title: {
        position: "relative",
        fontFamily: fonts.TITLE_heroworship_grad,
        color: colors.TITLE_SHADOW,
        fontSize: 150,
        right: 7,
        top: 7

    },
    secondery_title: {
        position: "absolute",
        fontFamily: fonts.TITLE_heroworship,
        color: colors.BLACK,
        fontSize: 150,
    },
    title_view: {
        position: 'relative',
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 100,
        justifyContent: 'center', alignItems: 'center'

    },
    inputs_cont: {
        borderWidth: 2,
        borderColor: colors.light_black,
        borderRadius: 4,
        padding: 5,
    },
    input: {
        padding: 5,
        backgroundColor: "red"
    },
    login_btn: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        textAlign: "center",
        textAlignVertical: "center",
        fontSize: 40,
    },
    biometric_btn: {
        width: 70,
        flexGrow: 2,
        justifyContent: "center"
    },
    btns_cont: {
        width: windowWidth * 0.87,
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "stretch",
        borderColor: colors.light_black,
        borderWidth: 2,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 3

    }
})