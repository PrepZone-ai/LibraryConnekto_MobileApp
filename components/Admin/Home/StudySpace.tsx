import React from 'react';
import { View, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const StudySpace: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Image Section */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: "https://static.readdy.ai/image/e527ea471eda48e8fccc9c667508d16a/239d9614b55c49d11408dd182796649a.jpeg" }}
          style={{ width: '100%', height: 224, resizeMode: 'cover' }}
        />
        
        {/* Overlay */}
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        
        {/* Text Overlay */}
        <View style={{ position: 'absolute', bottom: 24, left: 24 }}>
          <Text variant="headlineMedium" style={{ color: '#ef4444', fontWeight: 'bold' }}>Study Space</Text>
          
          {/* Features */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <MaterialIcons name="computer" size={18} color="#d8b4fe" /> 
            <Text style={{ color: '#86efac', marginLeft: 8 }}>300+ Study Stations</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <MaterialIcons name="wifi" size={18} color="#d8b4fe" /> 
            <Text style={{ color: '#86efac', marginLeft: 8 }}>High-Speed Internet</Text>
          </View>
        </View>
        
        {/* Book a Seat Button */}
        <Button
          mode="contained"
          style={{ position: 'absolute', bottom: 24, right: 24, borderRadius: 8 }}
          buttonColor="#7e22ce"
          contentStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
          onPress={() => console.log("Seat booked")}
        >
          Book a Seat
        </Button>
      </View>
    </View>
  );
};

export default StudySpace;
