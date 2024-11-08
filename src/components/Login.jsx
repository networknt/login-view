import React,  {useState} from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { makeStyles } from '@mui/styles';
import Container from '@mui/material/Container';
import ErrorMessage from './ErrorMessage';
import GoogleLogin from './GoogleLogin';
import FbLogin from './FbLogin';

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  loginButtons: {
    width: '100%',
    marginTop: theme.spacing(1),
  }
}));


function Login() {
  const classes = useStyles();

  let search = window.location.search;
  let params = new URLSearchParams(search);
  //console.log("client_id = ", params.get('client_id'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [state] = useState(params.get('state') == null ? '' : params.get('state'));
  const [clientId] = useState(params.get('client_id') == null ? '' : params.get('client_id'));
  const [userType] = useState(params.get('user_type') == null ? '' : params.get('user_type'));
  const [redirectUri] = useState(params.get('redirect_uri') == null ? '' : params.get('redirect_uri'));
  const [error, setError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [denyUrl, setDenyUrl] = useState(null);
  const [scopes, setScopes] = useState([]);

  const handleChangeUsername = e => {
    setUsername(e.target.value)
  };

  const handleChangePassword = e => {
    setPassword(e.target.value)
  };

  const handleChangeRemember = e => {
    setRemember(e.target.value)
  };

  const handleAccept = event => {
    event.preventDefault();
    //console.log("handleAccept is called");
    window.location.href = redirectUrl;
  }

  const handleCancel = event => {
    event.preventDefault();
    // here we use the redirectUrl to construct the deny url because the cookies
    // are saved to the redirect domain instead of signin.lightapi.net domain.
    //console.log("redirectUrl = ", redirectUrl);
    let pathArray = redirectUrl.split('/');
    let logoutPath = pathArray[0] + '//' + pathArray[2] + '/logout';
    //console.log("fetch url = ", logoutPath);
    // remove the server set cookies as the Javascript cannot access some of them. 
    fetch(logoutPath, { credentials: 'include'})
    .then(response => {
      if(response.ok) {
        window.location.href = denyUrl;
      } else {
        throw Error(response.statusText);
      }
    })
    .catch(error => {
        console.log("error=", error);
        setError(error.toString());
    });
  }

  function ScopeItems() {
    console.log("scopes =", scopes);
    return (
      <List component="nav" aria-label="secondary mailbox folders">
        {scopes.map((item, index) => (
          <ListItem key={index} button>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    )
  }

  const onGoogleSuccess = (res) => {
    console.log('Google Login Success: authorization code:', res.code);
    console.log('referrer: ', document.referrer);
    let pathArray = document.referrer.split('/');
    let host = pathArray[0] + '//' + pathArray[2];
    console.log('host = ', host);
    fetch(host + '/google?code=' + res.code, {redirect: 'follow', credentials: 'include'})
      .then(response => {
        if(response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(data => {
        console.log("data =", data);
        setRedirectUrl(data.redirectUri);
        setDenyUrl(data.denyUri);
        setScopes(data.scopes);
      })
      .catch(err => {
        err.text().then(errorMessage => {
          setError(errorMessage);
        })
      });
  };

  const onFacebookSuccess = (res) => {
    console.log('Login Success: accessToken:', res.accessToken);
    console.log('referrer: ', document.referrer);
    let pathArray = document.referrer.split('/');
    let host = pathArray[0] + '//' + pathArray[2];
    console.log('host = ', host);
    fetch(host + '/facebook?accessToken=' + res.accessToken, {redirect: 'follow', credentials: 'include'})
      .then(response => {
        if(response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(data => {
          console.log("data =", data);
          setRedirectUrl(data.redirectUri);
          setDenyUrl(data.denyUri);
          setScopes(data.scopes);
      })
      .catch(err => {
        err.text().then(errorMessage => {
          setError(errorMessage);
        })
      });
  };

  const handleSubmit = event => {
    //console.log("username = " + username + " password = " + password + " remember = " + remember);
    //console.log("state = " + state + " clientId = " + clientId + " userType = " + userType + " redirectUri = " + redirectUri);
    event.preventDefault();

    // state, user_type and redirect_uri might be empty
    let data = {
      j_username: username,
      j_password: password,
      remember: remember ? 'Y' : 'N',
      client_id: clientId
    };

    Object.assign(data, (state) && { state: state}, (userType) && {user_type: userType}, (redirectUri) && {redirect_uri: redirectUri})
    //console.log("data = " + data);
    const formData = Object.keys(data).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key])).join('&');

    //console.log(formData);
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(process.env.REACT_APP_SAAS_URL) && {'service_url': process.env.REACT_APP_SAAS_URL}
    };
    //console.log(headers);

    fetch("/oauth2/N2CMw0HGQXeLvC1wBfln2A/code", {
      method: 'POST',
      redirect: 'follow',
      credentials: 'include',
      headers: headers,
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    })
    .then(json => {
      //console.log(json);
      setRedirectUrl(json.redirectUri);
      setDenyUrl(json.denyUri);
      setScopes(json.scopes);
    })
    .catch(error => {
        error.text().then(errorMessage => {
        console.log("error=", errorMessage);
        const data = {
          email: username,
          password: password
        };
        const cmd = {
          host: 'lightapi.net',
          service: 'user',
          action: 'loginUser',
          version: '0.1.0',
          data: data
        };
        const url = '/portal/query?cmd=' + encodeURIComponent(JSON.stringify(cmd));
        const message = 'Login Failed! Click <a href="link">here</a> to identify root cause.'
        setError(message.replace('link', url));
      })
    });
  };
  
  if(redirectUrl !== null) {
    //console.log("display consent");
    //console.log(scopes);
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <form className={classes.form} noValidate onSubmit={handleAccept}>
            <Typography component="h1" variant="h5">
              Consent
            </Typography>  
            This application would like to access: 
            <Divider/>
            <List component="nav" aria-label="secondary mailbox folders">
              <ScopeItems/>
             </List>
            <Divider/>
            <Button
              type="submit"
              variant="contained"
              onClick={handleCancel}
              className={classes.submit}
            >
              Deny
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleAccept}
              className={classes.submit}
            >
              Accept
            </Button>
          </form>  
        </div>
      </Container>  
    )
  } 

  return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <ErrorMessage error={error}/>
          <form className={classes.form} noValidate onSubmit={handleSubmit}>
            <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="j_username"
                label="Email"
                name="j_username"
                value={username}
                autoComplete="username"
                autoFocus
                onChange={handleChangeUsername}
            />
            <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="j_password"
                value={password}
                label="Password"
                type="password"
                id="j_password"
                autoComplete="password"
                onChange={handleChangePassword}
            />
            <TextField
                name="state"
                value={state}
                type="hidden"
                id="state"
            />
            <TextField
                name="client_id"
                value={clientId}
                type="hidden"
                id="client_id"
            />
            <TextField
                name="user_type"
                value={userType}
                type="hidden"
                id="user_type"
            />
            <TextField
                name="redirect_uri"
                value={redirectUri}
                type="hidden"
                id="redirect_uri"
            />
            <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
                onChange={handleChangeRemember}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
            >
              Sign In
            </Button>
          </form>
          <div>Forget your password? <Link to="/forget">Reset Here</Link></div>
          <div className={classes.loginButtons}>
            <GoogleLogin onSuccess={onGoogleSuccess}/>
            <FbLogin onSuccess={onFacebookSuccess}/>
          </div>
        </div>
      </Container>
  );
}

export default Login;
