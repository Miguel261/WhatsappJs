const { default: axios } = require("axios");
require("dotenv").config();

const consultaCurpApi = async (data) => {
    try {
        console.log(`Consultando datos de: ${data}`);
        const response = await axios.put(
            process.env.apiptm + "/credential/user/search", {
            curp: data
        },
            {
                headers: {
                    "X-API-KEY": process.env.obtenerToken,
                },
            }
        );
        const userDatos = response.data;
        return userDatos;

    } catch (error) {
        if (error.response) {
            if (!error.response.data.message) {
                return null;
            } else {
                console.log(error.response.data.message);
                return error.response.status;
            }
        } else if (error.request) {
            console.log('Error de conexión:', error.message);
            return null;
        } else {
            console.log('Error:', error.message);
            return null;
        }
    }
};

const updateEmail = async (data, newEmail) =>{
    try {
        const response = await axios.put(
            process.env.apiptm + "/credential/user/" + data.id + "/update-email", {
            email: newEmail
        },
            {
                headers: {
                    "X-API-KEY": process.env.obtenerToken,
                },
            }
        );
        console.log('Correo Actualizado');
        return response.data.email;

    } catch (error) {
        if (error.response){
            return error.status;
        }
        else{
            return null;
        }
    }
};

const funtionApi = async (data, option) => {
    try {
        if (option === 1) {
            try {
                const response = await axios.put(
                    process.env.apiptm + "/credential/user/" + data.id + "/refresh_password", {},
                    {
                        headers: {
                            "X-API-KEY": process.env.obtenerToken,
                        },
                    }
                );
                console.log('Contraseña Actualizada');
                return response;

            } catch (error) {
                if (error.status) {
                    return error.status;
                }
                else {
                    return null;
                }
                
            }
        }

        if (option === 2) {
            try {
                const response = await axios.post(
                    process.env.apiptm + "/credential/user/" + data.id + "/generate-moodle-account", {},
                    {
                        headers: {
                            "X-API-KEY": process.env.obtenerToken,
                        },
                    }
                );

                return response.status;

            } catch (error) {
                if (error.status) {
                    return error.status;
                }
                else {
                    return null;
                }
            }
        }
    }
    catch (error) {
        return "Hubo un error";
    }
};

module.exports = {
    consultaCurpApi,
    funtionApi,
    updateEmail
};