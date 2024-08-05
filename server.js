const express = require('express');
const app = express();
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const { type } = require('os');

// Configurar el middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));

// Conectar a la base de datos MongoDB
// Conectar a la base de datos MongoDB Atlas
const uri = "mongodb+srv://mancillanixon7:um8xTFnPbq9eMwnx@systemdsi.mouqdaf.mongodb.net/system_blog?retryWrites=true&w=majority";
mongoose.connect(uri)
    .then(() => console.log('Conectado a MongoDB Atlas!'))
    .catch((error) => console.error('Error conectando a MongoDB Atlas:', error));


// Definir la estructura para registrar usuario en la colección "users"
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    isStudent: { type: Boolean, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fotoPerfil: {
        filename: { type: String },
        path: { type: String }
    },
    fecha_registro: { type: Date, default: Date.now }
});
const User = mongoose.model('users', userSchema);

// Definir el modelo para registrar las publicaciones de los usuarios
const publicationSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    text: { type: String },
    textArchivo: { type: String },
    image: {
        filename: { type: String },
        path: { type: String }
    },
    video: {
        filename: { type: String },
        path: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    createdAtDate: { type: Date, default: Date.now },
    createdAtTime: {
        type: String, default: () => {
            const date = new Date();
            return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        }
    },
    likes: { type: Number, default: 0 },
    comentarios: [
        {
            usuario: { type: String, required: true }, // Cambiar de mongoose.Schema.Types.ObjectId a String
            texto: { type: String, required: true },
            fecha: { type: Date, default: Date.now }
        }
    ]
});
const Publicacion = mongoose.model('Publicacion', publicationSchema);


//modelo para likes
const LikeSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    publicacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publicacion', required: true },
    createdAt: { type: Date, default: Date.now }
});
const Like = mongoose.model('likes', LikeSchema);;

// Configurar Multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directorio donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Generar un nombre único para el archivo
    }
});

const upload = multer({ storage: storage });

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://dsystem-blog.vercel.app/'); // Reemplaza con el dominio de tu aplicación React
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(cors());

// Middleware para servir archivos estáticos desde la carpeta "uploads"
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
});

// Ruta para crear un nuevo usuario
app.post('/api/users', async (req, res) => {
    try {
        const { name, lastName, phone, isStudent, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            lastName,
            phone,
            isStudent,
            email,
            password: hashedPassword,
            fotoPerfil: { filename: null, path: null } // Inicialmente, sin foto de perfil
        });
        console.log(newUser);
        await newUser.save();
        res.status(201).json({ message: 'Usuario creado con éxito' });
        console.log("Nuevo Usuario Registrado con Exito server.js");
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el usuario' });
        console.log("Error al Registrar Nuevo Usuario");
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos (email)' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos (password)' });
        }
        res.json({
            message: 'Inicio de sesión exitoso',
            name: `${user.name} ${user.lastName}`,
            id: user._id,
            email: user.email,
            fotoPerfil: {
                filename: user.fotoPerfil.filename,
                path: user.fotoPerfil.path
            }
        });
        console.log("Inicio de Sesion de usuario Exitoso server.js");
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

// Ruta para actualizar la foto de perfil
router.post('/api/update-profile-picture/:id', upload.single('fotoPerfil'), async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, path: filePath } = req.file; // Obtener el nombre y la ruta del archivo subido

        // Actualizar el usuario en la base de datos
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { fotoPerfil: { filename, path: filePath } },
            { new: true } // Devuelve el usuario actualizado
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Foto de perfil actualizada', user: updatedUser });
    } catch (error) {
        console.error('Error al actualizar la foto de perfil:', error);
        res.status(500).json({ message: 'Error al actualizar la foto de perfil' });
    }
});

//ruta pa obtener todas las publicaciones
app.get('/api/publicaciones', async (req, res) => {
    try {
        const publicaciones = await Publicacion.find();
        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las publicaciones' });
    }
})

// Ruta para guardar una nueva publicación , likes y comentarios
app.post('/api/publicaciones', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        const { userName, text, textArchivo } = req.body;
        const image = req.files.image ? req.files.image[0] : null;
        const video = req.files.video ? req.files.video[0] : null;

        const newPublicacion = new Publicacion({
            userName,
            text,
            textArchivo,
            image: image ? { filename: image.filename, path: image.path } : null,
            video: video ? { filename: video.filename, path: video.path } : null,
            likes: 0,
            comentarios: []
        });

        await newPublicacion.save();
        res.status(201).json({ message: 'Publicación enviada' });
        console.log("Nueva Publicación guardada en el servidor");
    } catch (error) {
        res.status(500).json({ message: 'Error al enviar la publicación' });
        console.log("Error al guardar la publicación en el servidor");
    }
});

//ruta para dar likes a la publicacion
app.post('/api/publicaciones/:publicacionId/like', async (req, res) => {
    try {
        const { publicacionId } = req.params;
        const { userName } = req.body;

        // Verificar si el usuario ya ha dado like a la publicación
        const existingLike = await Like.findOne({ userName, publicacionId });

        if (existingLike) {
            // Si ya existe, eliminar el like
            await Like.deleteOne({ userName, publicacionId });

            // Actualizar el número de likes en la publicación
            const publicacion = await Publicacion.findByIdAndUpdate(
                publicacionId,
                { $inc: { likes: -1 } }, // Decrementar el número de likes en 1
                { new: true } // Devolver la publicación actualizada
            );

            return res.status(200).json(publicacion);
        } else {
            // Si no existe, crear un nuevo like
            const newLike = new Like({ userName, publicacionId });
            await newLike.save();

            // Actualizar el número de likes en la publicación
            const publicacion = await Publicacion.findByIdAndUpdate(
                publicacionId,
                { $inc: { likes: 1 } }, // Incrementar el número de likes en 1
                { new: true } // Devolver la publicación actualizada
            );

            return res.status(200).json(publicacion);
        }
    } catch (error) {
        console.error('Error al dar like a la publicación:', error);
        res.status(500).json({ error: 'Error al dar like a la publicación' });
    }
});


//ruta para obtener los likes
app.get('/api/likes/:userName', async (req, res) => {
    try {
        const { userName } = req.params;
        const likes = await Like.find({ userName });
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los likes del usuario' });
    }
});


//ruta para guardar los comentarios de cada publicacion
app.post('/api/publicaciones/:publicacionId/comentar', async (req, res) => {
    try {
        const { publicacionId } = req.params;
        const { usuario, texto } = req.body;

        // Buscar la publicación por su ID
        const publicacion = await Publicacion.findById(publicacionId);

        // Agregar el comentario a la lista de comentarios
        publicacion.comentarios.push({
            usuario,
            texto,
            fecha: new Date(),
        });

        // Guardar la publicación actualizada
        await publicacion.save();

        // Obtener la publicación actualizada con los comentarios
        const updatedPublicacion = await Publicacion.findById(publicacionId).populate('comentarios.usuario');

        res.status(200).json(updatedPublicacion);
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar comentario a la publicación' });
    }
});


// Modelo de datos para cada "Me Gusta" de desarrolladores
const LikeDeveloperSchema = new mongoose.Schema({
    desarrolladorId: { type: String, required: true },
    likes: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            userName: { type: String, required: true },
            value: { type: Number, default: 0 },
        },
    ],
});

const LikeDeveloper = mongoose.model('LikeDeveloper', LikeDeveloperSchema);

// Ruta para obtener todos los "Me Gusta" de desarrolladores
app.get('/api/likesdev', async (req, res) => {
    try {
        const likes = await LikeDeveloper.find({});
        res.json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los "Me Gusta"' });
    }
});
// Ruta para actualizar los "Me Gusta" de desarrolladores
app.put('/api/likesdev/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userName, likes } = req.body;

        const likeDeveloper = await LikeDeveloper.findOneAndUpdate(
            { desarrolladorId: id },
            { likes },
            { new: true, upsert: true }
        );

        res.json(likeDeveloper);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar los "Me Gusta"' });
    }
});


// Ruta para borrar una publicación
app.delete('/api/borrar/publicaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Busca y elimina la publicación por su ID
        const deletedPublication = await Publicacion.findByIdAndDelete(id);

        if (!deletedPublication) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        res.status(200).json({ message: 'Publicación eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar la publicación:', error);
        res.status(500).json({ message: 'Error al eliminar la publicación' });
    }
});


// Iniciar el servidor
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('\x1b[32mServidor Iniciado en el puerto \x1b[0m', port);
});