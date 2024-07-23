import { useState, useEffect } from "react";

const ServirIMG = () => {
    const [file, setFile] = useState(null);

    useEffect(() => {
        const fetchFile = async (filename) => {
            try {
                const response = await fetch(`/api/uploads/${filename}`);
                const blob = await response.blob();
                setFile(URL.createObjectURL(blob));
            } catch (error) {
                console.error('Error fetching file:', error);
            }
        };

        fetchFile('imagen.jpg');
    }, []);

    return (
        <div>
            {file ? (
                <img src={file} alt="Imagen" />
            ) : (
                <p>Cargando imagen...</p>
            )}
        </div>
    );
};

export default ServirIMG;