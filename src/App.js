import React, {Component} from 'react';
import './App.css';
import { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';
var _ = require('lodash');
const parseUrl = require('parse-url');
var request = require('request')

let authLink = "https://accounts.spotify.com/authorize/?client_id=359164955c5c4be3847d9f74674921a3&response_type=code&redirect_uri=https://kiranthawardas.github.io/bandpass&scope=playlist-read-private%20user-library-read%20playlist-modify-private%20playlist-modify-public&show_dialog=true"
let apiURL = "https://v0slixnocd.execute-api.us-east-1.amazonaws.com/prod/bandpass"
if (window.location.hostname === "localhost") {
    apiURL = "http://localhost:12345/bandpass"
    authLink = "https://accounts.spotify.com/authorize/?client_id=359164955c5c4be3847d9f74674921a3&response_type=code&redirect_uri=http://localhost:3000&scope=playlist-read-private%20user-library-read%20playlist-modify-private%20playlist-modify-public&show_dialog=true"
}
let userCode;
let songs;
let minTempoPlaylist;
let maxTempoPlaylist;
let playlists;
let numActive;


class App extends Component {

    constructor(props) {
        super(props);
		this.state = {
            songList: undefined,
            playlistList: undefined,
            playlistURL: undefined,
            minTempoUser: 0,
            maxTempoUser: 100,
            minEnergyUser: 0,
            maxEnergyUser: 1,
            newPlaylistName: undefined,
            playlistError: false,
            newPlaylistSubmit: false};
        userCode = parseUrl(window.location.href).query["code"];
        if (localStorage.getItem('refreshToken') !== undefined && localStorage.getItem('refreshToken') !== null) {
            this.getPlaylists();
        }
		if (userCode !== undefined && (localStorage.getItem('refreshToken') === undefined || localStorage.getItem('refreshToken') === null)) {
			this.initialAuthorize();
		}
    }
    render() {
        return (
			<div className="App">
                {/*Global Header*/}
                {this.displayHeader()}
                {this.displayConfirmPlaylist()}
                {/*Start of Main App*/}
                {this.displayLoginScreen()}
                <div className="App-body">
                    {/*Playlist Screen*/}
                    {this.displayPlaylists()}

                    {/*Song Screen*/}

                    {this.displayCreatePlaylist()}
                    <div>
                        {this.displayFilters()}
                        {this.displaySongs()}
                    </div>
    	        </div>

            </div>
		);

    }




    displayHeader = () => {
        if (localStorage.getItem('refreshToken') === undefined ||
            localStorage.getItem('refreshToken') === null) {
                return (
                    <header className="App-header">
                        <h1 className="App-title noselect">bandpass</h1>
                        <a href={authLink}>
                            <button type="button" className="login-button btn btn-info">Log Into Spotify</button>
                        </a>
                    </header>
                )
        }
        if (localStorage.getItem('refreshToken') !== undefined && localStorage.getItem('refreshToken') !== null) {
            if (this.state.playlistURL !== undefined) {
                return (
    	            <header className="App-header">
                        <h1 className="App-title noselect">bandpass</h1>
                        <div>
                            <button onClick={() => this.getPlaylists(true)} type="button" className="reselect-playlist btn btn-info">Select Another Playlist</button>
                        </div>
                        <div className="username">
                            {localStorage.getItem('userID')}&nbsp;<a className="log-out-text" onClick={() => this.logOut()}>(log out)</a>
                        </div>
                    </header>
                )
            }
            else {
                return (
    	            <header className="App-header">
                        <h1 className="App-title noselect">bandpass</h1>
                        <div className="username">
                            {localStorage.getItem('userID')}&nbsp;<a className="log-out-text" onClick={() => this.logOut()}>(log out)</a>
                        </div>
                    </header>
                )

            }
        }
        return (
            <header className="App-header">
                <h1 className="App-title noselect">bandpass</h1>
            </header>
        )
    }


    displayLoginScreen = () => {
        if (localStorage.getItem('refreshToken') === undefined ||
            localStorage.getItem('refreshToken') === null) {
            return (
                <div className="welcome-screen">
                    <h1><b>Filter your spotify playlists</b></h1>
                    <h3><a href={authLink}>Log into spotify</a> and select an existing playlist</h3>
                    <h3>
                        Filter your songs using the
                        &nbsp;
                        <button className="btn btn-success">
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </button>
                        &nbsp;
                        <button className="btn btn-danger">
                            <i className="fa fa-minus" aria-hidden="true"></i>
                        </button>
                        &nbsp;
                        buttons
                    </h3>
                    <h3>
                        Press the
                        &nbsp;
                        <button className="btn btn-primary submit-button"><p>Submit</p></button>
                        &nbsp;
                        button to make a new playlist
                    </h3>
                </div>
            )
    }
}

    displayPlaylists = () => {
        if (this.state.playlistURL !== undefined || localStorage.getItem('refreshToken') === undefined || localStorage.getItem('refreshToken') === null) {
            return
        }
        return (
            <div>
                <ul className="playlist-items">
                    <li className="title-item active playlist-item col-md-12">
                        <div className="col-md-1"></div>
                        <h1 className="name col-md-3" onClick={() => this.sortPlaylists("Name")}>Playlist Name <i className="fa fa-sort" aria-hidden="true"></i></h1>
                        <h1 className="owner col-md-2" onClick={() => this.sortPlaylists("OwnerId")}>Playlist Owner <i className="fa fa-sort" aria-hidden="true"></i></h1>
                        <h1 className="public col-md-2" onClick={() => this.sortPlaylists("Public")}>Permissions <i className="fa fa-sort" aria-hidden="true"></i></h1>
                        <h1 className="count col-md-2" onClick={() => this.sortPlaylists("TrackCount")}>Track Count <i className="fa fa-sort" aria-hidden="true"></i></h1>
                        <h1 className="link col-md-1">Link</h1>
                        <div className="col-md-1"></div>
                    </li>
                    {this.state.playlistList}
                </ul>
                <div>
                    {this.displayPlaylistError()}
                </div>
            </div>
        )
    }

    displayPlaylistError = () => {
        if (!this.state.playlistError) {
            return;
        }
        else {
            return (
                <div id="playlist-error" className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error!</strong> This playlist is not available right now.
                    <button onClick={() => this.closePlaylistError()} type="button" className="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            )
        }
    }

    displayPlaylistItems = () => {
        this.setState({playlistList:
            playlists.map((playlist) =>
                <li onClick={() => this.setPlaylistURL(playlist.URL)} className="active playlist-item playlist-row col-md-12" id={playlist.Name}>
                    <div className="col-md-1"></div>
                    <h1 className="name col-md-3">{playlist.Name}</h1>
                    <h1 className="owner col-md-2">{playlist.OwnerId}</h1>
                    <h1 className="public col-md-2">{playlist.Public}</h1>
                    <h1 className="count col-md-2">{playlist.TrackCount}</h1>
                    <h1 className="link col-md-1">
                        <a href={playlist.URL} target="_none" onClick={e => e.stopPropagation()}>
                            <i className="fa fa-link" aria-hidden="true"></i>
                        </a>
                    </h1>
                    <div className="col-md-1"></div>
                </li>
              )
        })
    }

    displayCreatePlaylist = () => {
        if (!(this.state.playlistURL !== undefined && (localStorage.getItem('refreshToken') !== undefined && localStorage.getItem('refreshToken') !== null))) {
            return
        }
        return (
            <div>
                <div className="input-group mb-3 playlist-input col-md-6">

                    <div className="input-group-prepend">
                        <span className="input-group-text">New Playlist Name</span>
                    </div>
                    <input id="new-playlist-input" type="text" className="form-control" aria-label="New Playlist Name"></input>

                    <button onClick={() => this.newPlaylist()} className="input-group-append btn btn-primary submit-button">Submit</button>
                </div>
            </div>
        )
    }

    displayFilters = () => {
        if (!(this.state.playlistURL !== undefined && (localStorage.getItem('refreshToken') !== undefined && localStorage.getItem('refreshToken') !== null))) {
            return
        }
        return (
            <div className="modifiers-cluster">
                {this.displayTempoFilter()}
                {this.displayEnergyFilter()}
                {this.displaySelectAllNoneFilter()}
            </div>
        )
    }

    displayTempoFilter = () => {
        return (
            <div className="slider-wrapper">
                <div className="slider-wrapper-top">
                    <h1>Tempo</h1>
                    <button onClick={() => this.filterTempo("in")} type="button" className="btn btn-success">
                        <i className="fa fa-plus" aria-hidden="true"></i>
                    </button>
                    &nbsp;
                    <button onClick={() => this.filterTempo("out")}type="button" className="btn btn-danger">
                        <i className="fa fa-minus" aria-hidden="true"></i>
                    </button>
                </div>
                <div className="slider">
                    <Range allowCross={false} defaultValue={[0, 100]} onChange={this.onTempoBoundsChange}
                        trackStyle={[{backgroundColor: 'navy'}]}
                        railStyle={{backgroundColor: '#ACACAC'}} />
                </div>
                <div className="tempo-slider-endpoints">
                    <p>{Math.round(this.state.minTempoUser)} bpm</p>
                    <p>{Math.round(this.state.maxTempoUser)} bpm</p>
                </div>
            </div>
        )
    }

    displayEnergyFilter = () => {
        return (
            <div className="slider-wrapper">
                <div className="slider-wrapper-top">
                    <h1>Energy</h1>
                    <button onClick={() => this.filterEnergy("in")} type="button" className="btn btn-success">
                        <i className="fa fa-plus" aria-hidden="true"></i>
                    </button>
                    &nbsp;
                    <button onClick={() => this.filterEnergy("out")}type="button" className="btn btn-danger">
                        <i className="fa fa-minus" aria-hidden="true"></i>
                    </button>
                </div>
                <div className="slider">
                    <Range allowCross={false} defaultValue={[0, 3]} max={3} step={1} onChange={this.onEnergyBoundsChange}
                        trackStyle={[{backgroundColor: 'navy'}]}
                        railStyle={{backgroundColor: '#ACACAC'}} />
                </div>
                <div className="energy-icons">
                    {this.energyMeter(0)}
                    {this.energyMeter(0.5)}
                    {this.energyMeter(1)}
                </div>
            </div>
        )
    }

    displaySelectAllNoneFilter = () => {
        return (
            <div className="select-all-none">
                <button onClick={() => this.selectAllNone(true)} type="button" className="btn btn-info">Select All</button>
                <br></br>
                <button onClick={() => this.selectAllNone(false)} type="button" className="btn btn-info">Deselect All</button>
            </div>
        )
    }


	displaySongList = () => {
		this.setState({songList:
            Object.keys(songs).map(key =>
                <li className={songs[key].Active ? 'active song-item col-md-12' : 'inactive song-item col-md-12'} id={key}>
                    <div className="active-col">
                        <a href={songs[key].Uri} target="_none" onClick={e => e.stopPropagation()}>
                            <i className="fa fa-link" aria-hidden="true"></i>
                        </a>
                    </div>
                    <div className="active-col">
                        {this.activeIndicator(songs[key].Active)}
                    </div>
                    <div className="col-md-3 ">
                        <button onClick={() => this.filterSong({key}, "in")}  type="button" className="btn btn-success">
                    		<i className="fa fa-plus" aria-hidden="true"></i>
                    	</button>
                    	&nbsp;
                    	<button onClick={() => this.filterSong({key}, "out")}  type="button" className="btn btn-danger">
                    		<i className="fa fa-minus" aria-hidden="true"></i>
                    	</button>
                    	<h1 title={songs[key].Name} className="name">{songs[key].Name}</h1>
                    </div>

                    <div className="col-md-3">
                    	<button onClick={() => this.filterArtist({key}, "in")} type="button" className="btn btn-success">
                    		<i className="fa fa-plus" aria-hidden="true"></i>
                    	</button>
                    	&nbsp;
                    	<button onClick={() => this.filterArtist({key}, "out")} type="button" className="btn btn-danger">
                    		<i className="fa fa-minus" aria-hidden="true"></i>
                    	</button>
                    	<h1 title={songs[key].Artist} className="artist">{songs[key].Artist}</h1>
                    </div>

                    <div className="col-md-3">
                    	<button onClick={() => this.filterAlbum({key}, "in")} type="button" className="btn btn-success">
                    		<i className="fa fa-plus" aria-hidden="true"></i>
                    	</button>
                    	&nbsp;
                    	<button onClick={() => this.filterAlbum({key}, "out")} type="button" className="btn btn-danger">
                    		<i className="fa fa-minus" aria-hidden="true"></i>
                    	</button>
                    	<h1 title={songs[key].Album} className="album">{songs[key].Album}</h1>
                    </div>


                    <div className="col-md-1 tempo-item">
                        <h1 title={songs[key].Album} className="album">{Math.round(songs[key].Tempo)} bpm</h1>
                    </div>

                    <div clas="col-md-1">
                        {this.energyMeter(songs[key].Energy)}
                    </div>
                </li>
		      )
        })
	}

    energyMeter = (energyLevel) => {
        if (energyLevel < 0.33) {
            return (
                <div>
                    <i className="fa fa-circle energy-icon" aria-hidden="true"></i>
                </div>);
        }
        else if (energyLevel > 0.33 && energyLevel < 0.66) {
            return (
                <div>
                    <i className="fa fa-circle energy-icon" aria-hidden="true"></i>
                    <i className="fa fa-circle energy-icon" aria-hidden="true"></i>
                </div>);
        }
        else {
            return (
                <div>
                    <i className="fa fa-circle energy-icon" aria-hidden="true"></i>
                    <i className="fa fa-circle energy-icon" aria-hidden="true"></i>
                    <i className="fa fa-circle energy-icon" aria-hidden="true"></i>
                </div>);
        }
    }

    activeIndicator = (active) => {
        if (!active) {
            return (
                <div>
                    <i className="fa fa-circle active-icon" aria-hidden="true"></i>
                </div>);
        }
        else {
            return (
                <div>
                    <i className="fa fa-circle inactive-icon" aria-hidden="true"></i>
                </div>);
        }
    }

    displaySongs = () => {
        if (!(this.state.playlistURL !== undefined && (localStorage.getItem('refreshToken') !== undefined && localStorage.getItem('refreshToken') !== null))) {
            return
        }
        return (
            <ul className="song-items">
                <li className="title-item col-md-12 song-item">
                    <h1 className="active-col"></h1>

                    <h1 className="active-col" onClick={() => this.sortSongs("Active")}><i className="fa fa-sort" aria-hidden="true"></i></h1>
                    <h1 className="name col-md-3" onClick={() => this.sortSongs("Name")}>Title <i className="fa fa-sort" aria-hidden="true"></i></h1>

                    <h1 className="artist col-md-3" onClick={() => this.sortSongs("Artist")}>Artist <i className="fa fa-sort" aria-hidden="true"></i></h1>

                    <h1 className="album col-md-3" onClick={() => this.sortSongs("Album")}>Album <i className="fa fa-sort" aria-hidden="true"></i></h1>

                    <h1 className="tempo col-md-1" onClick={() => this.sortSongs("Tempo")}>Tempo <i className="fa fa-sort" aria-hidden="true"></i></h1>
                    <h1 className="energy col-md-1" onClick={() => this.sortSongs("Energy")}>Energy <i className="fa fa-sort" aria-hidden="true"></i></h1>

                </li>
                {this.state.songList}
            </ul>
        )
    }

    displayConfirmPlaylist = () => {
        if (!this.state.newPlaylistSubmit) {
            return;
        }
        let countActive = 0;
        for (let key in songs) {
            if (songs[key].Active === true) {
                countActive++;
            }
        }
        return (
            <div className="playlist-popup">
                You are creating a new playlist named <span className="bold-text"> {this.state.newPlaylistName}</span>
                <br></br>
                It contains <span className="bold-text"> {countActive} songs </span>
                <br></br>
                <br></br>
            <button onClick={() => this.createPlaylist()} type="button" className="btn btn-success">
                Confirm
            </button>
            &nbsp;
            <button onClick={() => this.cancelCreatePlaylist()} type="button" className="btn btn-danger">
                Cancel
            </button>
            </div>
        )
    }


    logOut = () => {
        localStorage.clear()
        this.setState({
            songList: undefined,
            playlistList: undefined,
            playlistURL: undefined,
            minTempoUser: 0,
            maxTempoUser: 100,
            minEnergyUser: 0,
            maxEnergyUser: 1,
            newPlaylistName: undefined,
            playlistError: false,
            newPlaylistSubmit: false
        });
        this.forceUpdate()
    }

    initialAuthorize = () => {
        localStorage.clear()
        this.setState({
            songList: undefined,
            playlistList: undefined,
            playlistURL: undefined,
            minTempoUser: 0,
            maxTempoUser: 100,
            minEnergyUser: 0,
            maxEnergyUser: 1,
            newPlaylistName: undefined,
            playlistError: false,
            newPlaylistSubmit: false
        });

        let requestURL = apiURL.concat("/authorize", "?code=", userCode);
        const options = {
            url: requestURL,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
            }
        };

        request(options, function(error, response, body) {
            if (body === undefined) {
                this.logOut();
            }
            let parsedBody = JSON.parse(body);
            localStorage.setItem('refreshToken',parsedBody.RefreshToken);
            localStorage.setItem('userID',parsedBody.UserID);
            this.getPlaylists()
        }.bind(this))
    }

    getPlaylists = () => {
        this.setState({
            songList: undefined,
            playlistURL: undefined,
            minTempoUser: 0,
            maxTempoUser: 100,
            minEnergyUser: 0,
            maxEnergyUser: 1,
            newPlaylistName: undefined,
            playlistError: false,
            newPlaylistSubmit: false
        });

        playlists = undefined;
        let requestURL = apiURL.concat("/getplaylists", "?code=", localStorage.getItem('refreshToken'));
        const options = {
            url: requestURL,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
            }
        };

        request(options, function(error, response, body) {
            if (body === undefined) {
                this.logOut();
                return;
            }
            playlists = JSON.parse(body)
            if (playlists.length <= 0) {
                this.logOut();
                return;
            }
            this.sortPlaylists("Name", false)
        }.bind(this))
    }

    sortPlaylists = (field, initial) => {
        if (typeof playlists[0][field] === 'string') {
            if (initial !== undefined && initial) {
                playlists = _.orderBy(playlists, [item => item[field].toLowerCase()], 'desc')
            }
            else {
                if (playlists[0][field] < playlists[playlists.length - 1][field]) {
                    playlists = _.orderBy(playlists, [item => item[field].toLowerCase()], 'desc')
                }
                else  {
                    playlists = _.orderBy(playlists, [item => item[field].toLowerCase()], 'asc')
                }
            }
        }
        else {
            if (initial !== undefined && initial) {
                playlists = _.orderBy(playlists, field, 'desc')
            }
            else {
                if (playlists[0][field] < playlists[playlists.length - 1][field]) {
                    playlists = _.orderBy(playlists, field, 'desc')
                }
                else  {
                    playlists = _.orderBy(playlists, field, 'asc')
                }
            }
        }
        this.displayPlaylistItems();
    }

    setPlaylistURL = (playlistLink) => {
        songs = undefined;
        this.setState(
            {songList: undefined}
        );
        this.getPlaylist(playlistLink);
    }

	getPlaylist = (playlistLink) => {
		let path= (parseUrl(playlistLink).pathname).split("/");
		let playlistUsername = path[2];
		let playlistId = path[4];
		let requestURL = apiURL.concat("/getplaylisttracks", "?userID=", playlistUsername, "&playlistID=", playlistId, "&code=", localStorage.getItem('refreshToken'))

		const options = {
		    url: requestURL,
		    method: 'GET',
		    headers: {
		        'Accept': 'application/json',
		        'Accept-Charset': 'utf-8',
		    }
		};

		request(options, function(error, response, body) {
            if (body === undefined) {
                this.logOut();
                return;
            }
			let temp = JSON.parse(body)
            songs = temp.Tracks
            if (songs.length === 0) {
                this.setState({playlistError: true, playlistURL: undefined});
                return;
            }
            numActive = songs.length;
            minTempoPlaylist = temp.Tempo_min
            maxTempoPlaylist = temp.Tempo_max
            this.setState({minTempoUser: temp.Tempo_min,
                      maxTempoUser:temp.Tempo_max});
            this.sortSongs("Name", true)

            this.setState(
                {playlistURL: playlistLink}
            );
		}.bind(this))
	}

    onTempoBoundsChange = (value) => {
        this.setState({minTempoUser: minTempoPlaylist + (value[0] * ((maxTempoPlaylist - minTempoPlaylist) / 100)),
                      maxTempoUser: minTempoPlaylist + (value[1] * ((maxTempoPlaylist - minTempoPlaylist) / 100))});
    }

    onEnergyBoundsChange = (value) => {
        this.setState({minEnergyUser: value[0] / 3,
                      maxEnergyUser: value[1] / 3});
    }

    closePlaylistError = () => {
        this.setState({playlistError: false})
    }

    sortSongs = (field, initial) => {
        if (typeof songs[0][field] === 'string') {
            if (initial !== undefined && initial) {
                songs = _.orderBy(songs, [item => item[field].toLowerCase()], 'desc')
            }
            else {
                if (songs[0][field] < songs[songs.length - 1][field]) {
                    songs = _.orderBy(songs, [item => item[field].toLowerCase()], 'desc')
                }
                else  {
                    songs = _.orderBy(songs, [item => item[field].toLowerCase()], 'asc')
                }
            }
        }
        else {
            if (initial !== undefined && initial) {
                songs = _.orderBy(songs, field, 'desc')
            }
            else {
                if (songs[0][field] < songs[songs.length - 1][field]) {
                    songs = _.orderBy(songs, field, 'desc')
                }
                else  {
                    songs = _.orderBy(songs, field, 'asc')
                }
            }
        }
        this.displaySongList();
    }

	filterSong = (keyIn, inOut) => {
        if (inOut === "in" && numActive === songs.length) {
            this.selectAllNone(false)
        }
		for (let key in songs) {
			if (inOut === "out" && key === keyIn.key && songs[key].Active !== false) {
				songs[key].Active = false;
                numActive--;
			}
			else if (inOut === "in" && key === keyIn.key && songs[key].Active !== true) {
				songs[key].Active = true;
                numActive++;
			}
		}
		this.displaySongList();
	}

	filterAlbum = (keyIn, inOut) => {
		let album = songs[keyIn.key].Album;
        if (inOut === "in" && numActive ===  songs.length) {
            this.selectAllNone(false)
        }
		for (let key in songs) {
			if (inOut === "out" && songs[key].Album === album && songs[key].Active !== false) {
				songs[key].Active = false;
                numActive--;
			}
			else if (inOut === "in" && songs[key].Album === album && songs[key].Active !== true) {
				songs[key].Active = true;
                numActive++
			}
		}
		this.displaySongList();
	}

	filterArtist = (keyIn, inOut) => {
        if (inOut === "in" && numActive === songs.length) {
            this.selectAllNone(false)
        }
		let artist = songs[keyIn.key].Artist;
		for (let key in songs) {
			if (inOut === "out" && songs[key].Artist === artist && songs[key].Active !== false) {
				songs[key].Active = false;
                numActive--;
			}
			else if (inOut === "in" && songs[key].Artist === artist && songs[key].Active !== true) {
				songs[key].Active = true;
                numActive++
			}
		}
		this.displaySongList();
	}


    filterTempo = (inOut) => {
        if (inOut === "in" && numActive === songs.length) {
            this.selectAllNone(false)
        }
        for (let key in songs) {
            if (inOut === "out" && songs[key].Tempo >= this.state.minTempoUser && songs[key].Tempo <= this.state.maxTempoUser && songs[key].Active !== false) {
                songs[key].Active = false;
                numActive--;
            }
            else if (inOut === "in" && songs[key].Tempo >= this.state.minTempoUser && songs[key].Tempo <= this.state.maxTempoUser && songs[key].Active !== true) {
                songs[key].Active = true;
                numActive++;
            }
        }
        this.displaySongList();
    }

    filterEnergy = (inOut) => {
        if (inOut === "in" && numActive === songs.length) {
            this.selectAllNone(false)
        }
        for (let key in songs) {
            if (inOut === "out" && songs[key].Energy >= this.state.minEnergyUser && songs[key].Energy <= this.state.maxEnergyUser && songs[key].Active !== false) {
                songs[key].Active = false;
                numActive--;
            }
            else if (inOut === "in" && songs[key].Energy >= this.state.minEnergyUser && songs[key].Energy <= this.state.maxEnergyUser && songs[key].Active !== true) {
                songs[key].Active = true;
                numActive++;
            }
        }
        this.displaySongList();
    }

	selectAllNone = (allOrNothing) => {
		for (let key in songs) {
			songs[key].Active = allOrNothing;
		}
        if (allOrNothing) {
            numActive = songs.length;
        }
        else {
            numActive = 0;
        }
		this.displaySongList();
	}

	newPlaylist = () => {

        let inputValue = document.getElementById("new-playlist-input").value;
        this.setState({newPlaylistName: inputValue, newPlaylistSubmit: true})
		let uriList = [];
		for (let key in songs) {
			if (songs[key].Active === true) {
				uriList.push(songs[key].Uri)
			}
		}
	}

    createPlaylist = () => {
        let uriList = [];
        for (let key in songs) {
            if (songs[key].Active === true) {
                uriList.push(songs[key].Uri)
            }
        }
        let map = {};
        map["uris"] = uriList

        let requestURL = apiURL.concat("/createplaylist", "?userID=", localStorage.getItem('userID'), "&playlistName=", this.state.newPlaylistName, "&code=", localStorage.getItem('refreshToken'))

        request.post({
             url: requestURL,
             form: JSON.stringify(map)
         },
         function(err, httpResponse, body) {
             console.log(err, body);
         }
        )

        this.setState({newPlaylistSubmit: false});
    }

    cancelCreatePlaylist = () => {
        this.setState({newPlaylistSubmit: false});
    }
}

export default App;
