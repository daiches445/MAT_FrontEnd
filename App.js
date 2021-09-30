import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//import type {Node} from 'react';

import Login from './pages/login/Login';
import Register from './pages/registration/Register';
import Main from './pages/Main';

I18nManager.allowRTL(false);
const Stack = createNativeStackNavigator();
export const manager = new BleManager();

const App = () => {

  useEffect(() => {

    console.log("APP UseEffect ====");
    const get_devices = async () => {
      await manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
      .then(devices=>{
        console.log("from connected dev " ,devices.length);
        devices.forEach(d => {
          console.log(d.id);
          if(d.isConnected()){
            console.log("is con");
          }
        });
      })
    }
    get_devices();
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Main" component={Main} />
      </Stack.Navigator>
    </NavigationContainer>
  )

};


export default App;
