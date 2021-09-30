import React, { useEffect, useState } from 'react';
import { TextInput, Button, StyleSheet, Text, View, PermissionsAndroid, Platform, Alert, ToastAndroid, Pressable } from 'react-native';
import { BleManager, Device, Service } from 'react-native-ble-plx';
import { manager } from '../../App';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import base64 from 'react-native-base64';
import BiometricPopup from './BiometricPopup'
import SignUpBiometric from './SignUpBiometric'
import * as Keychain from 'react-native-keychain';
import FingerprintScanner from 'react-native-fingerprint-scanner';

const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();

export default function Login({ navigation }) {
    const [username, setUsername] = useState("init_user")
    const [password, setPassword] = useState("init_pass")
    const [device, setDevice] = useState();
    const [BTstate, setBtstate] = useState();
    const [services, setServices] = useState([new Service()]);
    const [biometricVisibility, setBiometricVisibilty] = useState(false);


    useEffect(() => {
        if (!manager) {
            manager = new BleManager();
        }

        manager.state().then((state) => {
            setBtstate(state); console.log("INIT STATE ==== ", state);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })

        Keychain.resetGenericPassword();

    }, [])

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBtstate(state);
            console.log("State Change ==== ", state);
        });
        return () => subscription.remove();
    }, [manager]);


    async function ScanAndConnect() {

        await manager.startDeviceScan(null, null, (error, device) => {

            console.log("scanning");
            if (error) {
                console.log('ScanAndConnect error ============' + error.message);
                manager.stopDeviceScan();
                return;
            }

            if (device.name === "MAT") {
                setDevice(device);
                console.log("Device ID = " + device.id);
            }
            manager.stopDeviceScan();
        });

    }

    async function ConnectToDevice(id) {
        console.log('connecting..');

        await manager.connectToDevice(id, { autoConnect: true })
            .then((d) => {
                (async () => {
                    console.log("discover services....");
                    d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)
                    const serv = await manager.servicesForDevice(id)
                    setDevice(d);
                    setServices(serv);
                    //console.log("serv 2 ==== ", serv[2]);

                })().catch((err) => { console.log("CATCH DISCOVER SERVICES =========== " + err); });
            })
            .catch((err) => { console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err)) })
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
                console.log("DATA TO SEND =====",JSON.stringify(data));
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
                                return true;
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
        let char_uuid = "a0b10005-e8f2-537e-4f6c-d104768a1214";
        let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
        let auth_service = services.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {


                console.log(JSON.stringify(data));
                let msg = encoder.encode(JSON.stringify(data));
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
                                return { res: true, value: "" };
                            }
                            else {
                                console.log(response, " INCORRECT");
                                return { res: false, value: response };
                            }
                        })

                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });
                //setCharacteristics(res)

            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });

        return { res: false, value: "server" };
    }

    async function SetCredentials() {
        await Keychain.setGenericPassword(username, password, { accessControl: 'BiometryCurrentSetOrDevicePasscode' });
        let cred = await Keychain.getGenericPassword().catch(err => { console.log("Credentials Error", err) });
        console.log(cred);
    }



    function Disconnect() {
        console.log('disconect');
        if (device === null) {
            console.log("device undifined");
            return;
        }
        try {
            device.cancelConnection().catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })

        } catch (error) {
            console.log("CATCH dissconect error =======" + JSON.stringify(error));
        }
    }

    function IsDeviceConnected() {
        console.log("IsDeviceConnected function");
        if (!device)
            return (<View></View>)
        if (device.isConnected()) {
            return (
                <View>
                    {/* <Button title="Add fingerprint" onPress={SetCredentials} /> */}
                    <Button title="disconnect" onPress={Disconnect} />
                    <SignUpBiometric
                        SignUp={SignUpBiometric}
                        visibility={biometricVisibility}
                        setVisibilty={setBiometricVisibilty} />
                </View>
            )
        }
    }

    return (
        <View>
            <Button title="Search For MAT" onPress={ScanAndConnect} />
            <View >
                {device ?
                    <Pressable
                        onPress={() => { ConnectToDevice(device.id) }}>
                        <Text style={{ fontSize: 30, margin: 10 }}>{device.name}</Text>
                    </Pressable> : console.log("no mat dev avilable")}
            </View>
            <TextInput maxLength={20} placeholder="username" onChangeText={setUsername} />
            <TextInput maxLength={20} secureTextEntry={true} placeholder="password" onChangeText={setPassword} />

            <Button disabled={BTstate == "PoweredOn" ? false : true} title="Login" onPress={SignInUserData} />
            <Button title="move to reg" onPress={() => { navigation.navigate("Register") }} />

            {/* <Button title ="Add fingerprint" onPress={SetCredentials}/>
            <Button title="disconnect" onPress={Disconnect} />
            <SignUpBiometric
                SignUp={SignUpBiometric}
                visibility={biometricVisibility}
                setVisibilty={setBiometricVisibilty} /> */}
            {this.IsDeviceConnected()}

            <Text style={{ color: "red" }}>{BTstate == "PoweredOn" ? "" : "Turn Bluetooth ON."}</Text>

        </View>
    )
}