require('dotenv').config();

const fs = require('fs');

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// CRIA CONFIG
if (!fs.existsSync('./config.json')) {

    fs.writeFileSync('./config.json', JSON.stringify({

        titulo: 'OrdeXTeam • Oficial',

        descricao: `
👑 Dono Do Servidor: @alguém por ai

✅ Status Do Servidor: Online
        `,

        banner: 'https://i.imgur.com/yourbanner.png',

        cor: '#2b2d31',

        painelMensagem: null,
        painelCanal: null

    }, null, 4));
}

// CARREGA CONFIG
let painelConfig = JSON.parse(
    fs.readFileSync('./config.json')
);

// SALVAR CONFIG
function salvarConfig() {

    fs.writeFileSync(
        './config.json',
        JSON.stringify(painelConfig, null, 4)
    );
}

// CLIENT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

let painelMensagem = painelConfig.painelMensagem;
let painelCanal = painelConfig.painelCanal;

// READY
client.once('ready', async () => {

    console.log(`${client.user.tag} online!`);

    // SLASH COMMANDS
    const commands = [

        new SlashCommandBuilder()
            .setName('publicar-painel')
            .setDescription('Publica o painel automático'),

        new SlashCommandBuilder()
            .setName('painel-config')
            .setDescription('Configura o painel'),

        new SlashCommandBuilder()
            .setName('deletar-painel')
            .setDescription('Remove o painel automático')

    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' })
        .setToken(process.env.TOKEN);

    try {

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('Slash commands registrados.');

    } catch (err) {

        console.log(err);
    }

    // AUTO UPDATE
    setInterval(async () => {

        if (!painelMensagem || !painelCanal) return;

        try {

            const canal = await client.channels.fetch(painelCanal);

            const mensagem = await canal.messages.fetch(painelMensagem);

            const guild = canal.guild;

            const membros = guild.memberCount;

            const online = guild.members.cache.filter(
                member =>
                    member.presence &&
                    member.presence.status !== 'offline'
            ).size;

            const offline = membros - online;

            const embed = new EmbedBuilder()

                .setTitle(painelConfig.titulo)

                .setDescription(`
${painelConfig.descricao}

👥 **Membros**

🟢 Online: ${online}
⚫ Offline: ${offline}

📊 Total: ${membros} membros
                `)

                .setImage(painelConfig.banner)

                .setColor(painelConfig.cor);

            const row = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId('status')
                    .setLabel('Servidor Online')
                    .setStyle(ButtonStyle.Success)

            );

            await mensagem.edit({
                embeds: [embed],
                components: [row]
            });

        } catch {

            console.log('Erro ao atualizar painel.');
        }

    }, 10000);
});

// INTERAÇÕES
client.on('interactionCreate', async (interaction) => {

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {

        // PUBLICAR PAINEL
        if (interaction.commandName === 'publicar-painel') {

            const membros = interaction.guild.memberCount;

            const online = interaction.guild.members.cache.filter(
                member =>
                    member.presence &&
                    member.presence.status !== 'offline'
            ).size;

            const offline = membros - online;

            const embed = new EmbedBuilder()

                .setTitle(painelConfig.titulo)

                .setDescription(`
${painelConfig.descricao}

👥 **Membros**

🟢 Online: ${online}
⚫ Offline: ${offline}

📊 Total: ${membros} membros
                `)

                .setImage(painelConfig.banner)

                .setColor(painelConfig.cor);

            const row = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId('status')
                    .setLabel('Servidor Online')
                    .setStyle(ButtonStyle.Success)

            );

            const msg = await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            painelMensagem = msg.id;
            painelCanal = interaction.channel.id;

            painelConfig.painelMensagem = msg.id;
            painelConfig.painelCanal = interaction.channel.id;

            salvarConfig();

            await interaction.reply({
                content: '✅ Painel automático publicado.',
                ephemeral: true
            });
        }

        // CONFIG
        if (interaction.commandName === 'painel-config') {

            const row = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId('config_banner')
                    .setLabel('Banner')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('config_titulo')
                    .setLabel('Título')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('config_desc')
                    .setLabel('Descrição')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('config_cor')
                    .setLabel('Cor')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('preview')
                    .setLabel('Preview')
                    .setStyle(ButtonStyle.Success)

            );

            await interaction.reply({
                content: '⚙️ Painel de configuração:',
                components: [row],
                ephemeral: true
            });
        }

        // DELETAR PAINEL
        if (interaction.commandName === 'deletar-painel') {

            try {

                const canal = await client.channels.fetch(painelCanal);

                const mensagem = await canal.messages.fetch(painelMensagem);

                await mensagem.delete();

                painelMensagem = null;
                painelCanal = null;

                painelConfig.painelMensagem = null;
                painelConfig.painelCanal = null;

                salvarConfig();

                return interaction.reply({
                    content: '✅ Painel deletado.',
                    ephemeral: true
                });

            } catch {

                return interaction.reply({
                    content: '❌ Não encontrei o painel.',
                    ephemeral: true
                });
            }
        }
    }

    // BOTÕES
    if (interaction.isButton()) {

        // PREVIEW
        if (interaction.customId === 'preview') {

            const membros = interaction.guild.memberCount;

            const online = interaction.guild.members.cache.filter(
                member =>
                    member.presence &&
                    member.presence.status !== 'offline'
            ).size;

            const offline = membros - online;

            const embed = new EmbedBuilder()

                .setTitle(painelConfig.titulo)

                .setDescription(`
${painelConfig.descricao}

👥 **Membros**

🟢 Online: ${online}
⚫ Offline: ${offline}

📊 Total: ${membros} membros
                `)

                .setImage(painelConfig.banner)

                .setColor(painelConfig.cor);

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // BANNER
        if (interaction.customId === 'config_banner') {

            const modal = new ModalBuilder()
                .setCustomId('modal_banner')
                .setTitle('Configurar Banner');

            const input = new TextInputBuilder()
                .setCustomId('banner')
                .setLabel('Link da imagem')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);

            modal.addComponents(row);

            return interaction.showModal(modal);
        }

        // TITULO
        if (interaction.customId === 'config_titulo') {

            const modal = new ModalBuilder()
                .setCustomId('modal_titulo')
                .setTitle('Configurar Título');

            const input = new TextInputBuilder()
                .setCustomId('titulo')
                .setLabel('Novo título')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);

            modal.addComponents(row);

            return interaction.showModal(modal);
        }

        // DESCRIÇÃO
        if (interaction.customId === 'config_desc') {

            const modal = new ModalBuilder()
                .setCustomId('modal_desc')
                .setTitle('Configurar Descrição');

            const input = new TextInputBuilder()
                .setCustomId('desc')
                .setLabel('Nova descrição')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);

            modal.addComponents(row);

            return interaction.showModal(modal);
        }

        // COR
        if (interaction.customId === 'config_cor') {

            const modal = new ModalBuilder()
                .setCustomId('modal_cor')
                .setTitle('Configurar Cor');

            const input = new TextInputBuilder()
                .setCustomId('cor')
                .setLabel('Cor HEX (#ffffff)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);

            modal.addComponents(row);

            return interaction.showModal(modal);
        }
    }

    // MODAIS
    if (interaction.isModalSubmit()) {

        // BANNER
        if (interaction.customId === 'modal_banner') {

            painelConfig.banner =
                interaction.fields.getTextInputValue('banner');

            salvarConfig();

            return interaction.reply({
                content: '✅ Banner configurado.',
                ephemeral: true
            });
        }

        // TITULO
        if (interaction.customId === 'modal_titulo') {

            painelConfig.titulo =
                interaction.fields.getTextInputValue('titulo');

            salvarConfig();

            return interaction.reply({
                content: '✅ Título configurado.',
                ephemeral: true
            });
        }

        // DESCRIÇÃO
        if (interaction.customId === 'modal_desc') {

            painelConfig.descricao =
                interaction.fields.getTextInputValue('desc');

            salvarConfig();

            return interaction.reply({
                content: '✅ Descrição configurada.',
                ephemeral: true
            });
        }

        // COR
        if (interaction.customId === 'modal_cor') {

            painelConfig.cor =
                interaction.fields.getTextInputValue('cor');

            salvarConfig();

            return interaction.reply({
                content: '✅ Cor configurada.',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);