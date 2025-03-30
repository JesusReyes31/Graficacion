import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../config/mysql"

// Definición de los atributos del usuario
interface UsuariosAttributes {
    ID: number;
    Nombre: string;
}

// Atributos opcionales para la creación de un usuario
interface UsuariosCreationAttributes extends Optional<UsuariosAttributes, 'ID'> {}

// Definición de la clase de modelo
class Usuarios extends Model<UsuariosAttributes, UsuariosCreationAttributes> implements UsuariosAttributes {
    public ID!: number;
    public Nombre!:string;
}

// Inicialización del modelo
Usuarios.init({
    ID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING,
        allowNull:false
    },
}, {
    sequelize,
    tableName: 'Usuarios',
    timestamps: false, 
});

export { Usuarios, UsuariosAttributes };
