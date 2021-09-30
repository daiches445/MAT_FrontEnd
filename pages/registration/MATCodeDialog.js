import React, { useContext, useEffect, useState } from 'react';
import Dialog from "react-native-dialog";
import { UserContext } from './Register';
import { View,Button, ToastAndroid } from 'react-native';
import ShakingText from 'react-native-shaking-text';

export default function MATCodeDialog(props) {

    
    const userCtx = useContext(UserContext);
    const handleCodeSend=()=>{
        
        if(props.init_code.length < 8){
            ToastAndroid.show("MAT CODE too short.",ToastAndroid.LONG)
            return;
        }
        userCtx.dispatch({type:"mat_code",value:props.init_code})
        props.SendMATcode()
    }

    return (
        <View >
            <Button title="Show dialog" onPress={()=>{props.setVisible(!props.visible)}}/>
            <Dialog.Container visible={props.visible}>
                <Dialog.Title>Enter MAT code</Dialog.Title>
                <Dialog.Description>
                    Enter the 8 digit code printed inside the MAT controller package.{props.init_code}
                </Dialog.Description>
                <Dialog.Input maxLength ={8} onChangeText={props.setInitCode}/>
                <Dialog.Description style = {{color:"red"}}><ShakingText>{userCtx.state.mat_code?"":"Invalid code Please try again"}</ShakingText></Dialog.Description>
                <Dialog.Button label="Send" onPress={handleCodeSend}/>
                <Dialog.Button label="Cancel" onPress={()=>{props.setVisible(false)}}/>
            </Dialog.Container>
        </View>
    )
}