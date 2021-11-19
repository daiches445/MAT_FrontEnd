import React, { useContext, useEffect, useState } from 'react';
import { View, Button, ToastAndroid } from 'react-native';
import Dialog from "react-native-dialog";
import ShakeText from 'react-native-shake-text';

import { BleManager} from 'react-native-ble-plx';
import { manager } from '../../App';

import { UserContext } from './Register';
import { BLEcontext } from '../../App';

export default function MATCodeDialog(props) {


    const userCtx = useContext(UserContext);
    const BLEctx = useContext(BLEcontext);

    const [init_code, setInitCode] = useState("");


    useEffect(() => {
        if(!manager)
            manager = new BleManager();

    }, [])

    const handleCodeSend = () => {

        if (props.init_code.length < 8) {
            ToastAndroid.show("MAT CODE too short.", ToastAndroid.LONG)
            return;
        }
        //userCtx.dispatch({ type: "mat_code", value: props.init_code })
        SendMATcode()
    }

    async function SendMATcode() {

        let response;
        let char_uuid = "a0b10003-e8f2-537e-4f6c-d104768a1214";
        let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
        //let serv = services;
        let auth_service = BLEctx.state.services.find(s => s.uuid === auth_service_uuid)
        let device = BLEctx.state.device;

        if (auth_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }

        await manager.characteristicsForDevice(device.id,auth_service.uuid).then(
            res => {
                //console.log("CHARS ", res);
                let msg = encoder.encode(init_code);
                let init_code_char = res.find(c => c.uuid === char_uuid);

                manager.writeCharacteristicWithResponseForDevice(device.id, init_code_char.uuid, Buffer.from(msg).toString('base64'))
                .then(char => {

                    char.read().then(res => {
                        response = base64.decode(res.value);
                        console.log("FIRST RESPONSE ===== ", response);
                    }).finally(() => {
                        if (response === "true") {
                            console.log("res == true");

                            setCodeDialogVisible(false);
                            //SendUserData();
                        }
                        else {
                            console.log("res == false", response);
                            userCtx.dispatch({ type: "mat_code", value: false })
                        }

                    }).catch((err) => { console.log("CHAR READ ERROR ===", err); })
                }).catch(err => { console.log("CATCH WRITE DATE  ", err); })
            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });
    }

    function Disconnect() {
        console.log('disconect');
        if (BLEctx.state.device === null) {
            console.log("device undifined");
            return;
        }
        props.setIs_device_connected(false);

        try {
            BLEctx.state.device.cancelConnection().catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })

        } catch (error) {
            console.log("CATCH dissconect error =======" + JSON.stringify(error));
        }
    }


    return (
        <View >
            <Button title="Show dialog" onPress={() => { props.setVisible(!props.visible) }} />
            <Dialog.Container visible={props.is_device_connected}>
                <Dialog.Title>Enter MAT code</Dialog.Title>
                <Dialog.Description>
                    Enter the 8 digit code printed inside the MAT controller package.
                </Dialog.Description>
                <Dialog.Input maxLength={8} onChangeText={props.setInitCode} />
                <Dialog.Description style={{ color: "red" }}>
                    <ShakeText>{userCtx.state.mat_code ? "" : "Invalid code Please try again"}</ShakeText>
                </Dialog.Description>
                <Dialog.Button label="Send" onPress={handleCodeSend} />
                <Dialog.Button label="Cancel" onPress={Disconnect} />
            </Dialog.Container>
        </View>
    )
}