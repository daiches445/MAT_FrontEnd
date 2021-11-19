import React from 'react'
import { View, Text,StyleSheet } from 'react-native'
import Dialog from "react-native-dialog";
import { manager } from '../../App';
import { TITLE_big_noodle_titling } from '../../styles/typography';

export default function BluetoothOffDialog(props) {
    return (
        <View>
            <Dialog.Container visible={props.BTstate == "PoweredOn" ? false : true}>
                <Dialog.Title style={styles.title}>Bluetooth is Off</Dialog.Title>
                <Dialog.Description>Please turn Bluetooth on in order to procced.</Dialog.Description>
                <Dialog.Button style={styles.no_bt_btn} label="turn bluetooth on" onPress={() => {
                    (manager.enable()).
                    catch((err) => { console.log(err) })
                }}>Turn on</Dialog.Button>
                <Dialog.Button label="cancel" onPress={()=>{props.handleCancel}}/>
            </Dialog.Container>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: "red",
        justifyContent: "space-around",
        margin: 4
    },
    title:{
        fontWeight:"bold",
    },
    no_bt_btn: {
        fontWeight:"bold",
        color:"black",
        right:40
    }
});