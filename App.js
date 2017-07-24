import React from 'react';
import { 
  AppRegistry,
  Dimensions,
  StyleSheet,
  Text,
  Image,
  View,
  TouchableNativeFeedback,
  AsyncStorage,
 } from 'react-native';
import { StackNavigator } from 'react-navigation'; // By react-community
import MapView from 'react-native-maps'; // By AirBNB
import Prompt from 'react-native-prompt'; // By jaysoo
import firebase from 'firebase';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

// Image assets
import greenMarker from './assets/greenMarker.png';
import greenMarkerLight from './assets/greenMarkerLight.png';
import ripeAvo from './assets/ripe.png';
import unRipeAvo from './assets/hard.png';

// Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyClHKpEfoH825zoDJDfkxRWq-N9ucfuXJ4",
  authDomain: "avogago.firebaseapp.com",
  databaseURL: "https://avogago.firebaseio.com",
  projectId: "avogago",
  storageBucket: "",
  messagingSenderId: "933565605064"
});
var database = firebase.database();

class MapTest extends React.Component {
  constructor(props) {
    super(props); // "this" is uninitialized if super() is not called, call is required in constructors of subclasses
    this.state = {
      weightPromptVisible: true,
      usernamePromptVisible: false,
      myMarker: {
        latitude: 41.758126,
        longitude: -73.404369
      },
      markers: [],
      username: "rutger",
      avogadoWeight: 0,
    };
    // Bind correct scope to functions declared herafter
    // in order to acces setState etc.
    this._setUserMarker = this._setUserMarker.bind(this);
    this._updateUsername = this._updateUsername.bind(this);
  }

  componentDidMount() {
    // Piece of firebase code that updates the markers when they change in the DB
    var that = this
    var markerRef = firebase.database().ref('markers/');
    markerRef.on('value', function(snapshot) {
      const val = snapshot.val() // get the data
      if(typeof(val) !== "undefined") { // snapshot is occasionally undefined
        that.setState(previousState => {
          return { 
            ...previousState,
            markers: Object.values(val[that.props.avoType])
          };
        });
      }
    });
    // get username from storage
    AsyncStorage.getItem('@Store:username').then(val => {
      if (val !== null){
        this.setState({username: val});
      } else {
        this.setState({usernamePromptVisible: true});
      }
    }).done(); // Handles exeptions properly 
  }

  _setUserMarker(coordinate) {
    this.setState({myMarker: coordinate});
    var newKey = database.ref('markers').push().key
    database.ref(`markers/${this.props.avoType}/${this.state.username}`).update({
      coordinate,
      username: this.state.username,
      key: newKey,
      weight: this.state.avogadoWeight
    });
  }

  _updateUsername(val) {
    this.setState({
      usernamePromptVisible: false,
      username: val
    })
    AsyncStorage.setItem('@Store:username', val);
  }

  render() {
    let display = this.state.showText ? this.props.text : ' ';
     return (
      <View style ={styles.container}>
        <Prompt
          title="What is the aprox. weight of your avocado?"
          placeholder="e.g. 100g, 1 lbs"
          visible={this.state.weightPromptVisible}
          onCancel={ () => this.setState({
            weightPromptVisible: false,
          }) }
          onSubmit={ (value) => this.setState({
            weightPromptVisible: false,
            avogadoWeight: value
          }) }
        />
        <Prompt
          title="Hey, I see it's you first time here, please enter a username:"
          placeholder="e.g. stormageddon"
          visible={ this.state.usernamePromptVisible }
          onCancel={ () => this.setState({
            usernamePromptVisible: false,
          }) }
          onSubmit={(val) => this._updateUsername(val)}
        />
        <MapView style={styles.map} >
          {/* Here the markers from the DB get rendered */}
          {this.state.markers
            .filter(m => m.username !== this.state.username) // so the user's is not rendered here
            .map(marker => (
            <MapView.Marker
              coordinate={marker.coordinate}
              title={marker.username}
              key={marker.key}
              image={greenMarker}
              description={marker.weight}
            />
          ))}
          {/* This is the users draggable marker */}
          <MapView.Marker draggable
            coordinate={this.state.myMarker}
            image={greenMarkerLight}
            onDragEnd={(e) => this._setUserMarker(e.nativeEvent.coordinate)}
          />
        </MapView>
      </View>
    )
  }
}

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
    headerTintColor: "white", // color of text in the nav bar
    headerStyle: {
      backgroundColor: "#663E05"
    }
  };

  render() {
      const { navigate } = this.props.navigation;
      const { params } = this.props.navigation.state;

      return (
        <View style={styles.homeView}>
          <View style={[styles.button, styles.buttonRipe]}>
            <TouchableNativeFeedback onPress={() => navigate('Map', { avoType: 'ripe' })} >
              <View style={styles.avoCircle}>
               <Image 
                source={ripeAvo}
                style={styles.avoCircleIcon}
               />
              </View>
            </TouchableNativeFeedback>
            <Text style={styles.buttonText}>
              ready to eat!
            </Text>
          </View>
          <View style={styles.triangle} />
          <View style={[styles.button, styles.buttonHard]}>
            <TouchableNativeFeedback onPress={() => navigate('Map', { avoType: 'notRipe' })} >
              <View style={styles.avoCircle}>
                <Image 
                  source={unRipeAvo}
                  style={styles.avoCircleIcon}
                />
              </View>
            </TouchableNativeFeedback>
            <Text style={styles.buttonText}>
              not yet ripe
            </Text>
          </View>
        </View>
      );
    }
  }

class MapsScreen extends React.Component {

  static navigationOptions = {
    title: 'Map view',
    headerTintColor: "white", // color of text in the nav bar
    headerStyle: {
      backgroundColor: "#663E05"
    }
  };

  render() {
      const { params } = this.props.navigation.state;
      return (
        <View>
          <MapTest avoType={params.avoType} />
        </View>
      );
    }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 550,
    width: 400,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  homeView: {
    flex: 1,
  },
  button: {
    flex: 1, // Dictates the relative size
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonHard: {
    backgroundColor: "#222E0F",
  },
  buttonRipe: {
    backgroundColor: "#2A6827",
  },
  buttonText: {
    color: "white",
  },
  avoCircle: {
    height: 100,
    width: 100,
    borderRadius: 50,
    backgroundColor: "#839721",
    // So the images are centred:
    justifyContent: 'center',
    alignItems: 'center',
  },
  avoCircleIcon: {
    height: 80,
    width: 80,
  },
  triangle: {
    width: 0,
    height: 0,
    alignSelf: 'stretch',
    backgroundColor: "#2A6827",
    borderStyle: 'solid',
    borderRightWidth: width,
    borderTopWidth: 100,
    borderRightColor: 'transparent',
    borderTopColor: "#222E0F",
    transform: [
      {rotate: '180deg'}
    ]
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

const App = StackNavigator({
  Home: { screen: HomeScreen },
  Map: { screen: MapsScreen },
});

AppRegistry.registerComponent('App', () => App);

export default App
