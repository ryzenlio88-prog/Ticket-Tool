import discord
from discord.ext import commands

TOKEN = "YOUR_BOT_TOKEN"

TICKET_CATEGORY_ID = 123456789012345678
SUPPORT_ROLE_ID = 123456789012345678

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)


class TicketPanel(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Create Ticket",
        emoji="🎫",
        style=discord.ButtonStyle.primary,
        custom_id="zyrox_create_ticket"
    )
    async def create_ticket(self, interaction, button):
        guild = interaction.guild
        category = guild.get_channel(TICKET_CATEGORY_ID)
        support = guild.get_role(SUPPORT_ROLE_ID)

        if category is None or support is None:
            await interaction.response.send_message(
                "Ticket configuration is incorrect.",
                ephemeral=True
            )
            return

        existing = discord.utils.get(
            category.text_channels,
            name=f"ticket-{interaction.user.id}"
        )

        if existing:
            await interaction.response.send_message(
                f"You already have a ticket: {existing.mention}",
                ephemeral=True
            )
            return

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(
                view_channel=False
            ),
            interaction.user: discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                read_message_history=True
            ),
            support: discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                read_message_history=True
            )
        }

        channel = await guild.create_text_channel(
            name=f"ticket-{interaction.user.id}",
            category=category,
            overwrites=overwrites
        )

        embed = discord.Embed(
            title="ZYROX SUPPORT",
            description=(
                f"Welcome {interaction.user.mention}!\n\n"
                "Please describe your issue below.\n"
                "Our support team will assist you shortly."
            ),
            color=discord.Color.red()
        )

        embed.set_footer(text="ZYROX • SUPPORT SYSTEM")

        await channel.send(
            content=support.mention,
            embed=embed,
            view=CloseTicket()
        )

        await interaction.response.send_message(
            f"Your ticket has been created: {channel.mention}",
            ephemeral=True
        )


class CloseTicket(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Close Ticket",
        emoji="🔒",
        style=discord.ButtonStyle.danger,
        custom_id="zyrox_close_ticket"
    )
    async def close_ticket(self, interaction, button):
        if not interaction.channel.name.startswith("ticket-"):
            await interaction.response.send_message(
                "This is not a ticket.",
                ephemeral=True
            )
            return

        await interaction.response.send_message(
            "Ticket will be closed in 5 seconds."
        )

        import asyncio
        await asyncio.sleep(5)
        await interaction.channel.delete()


@bot.command()
@commands.has_permissions(administrator=True)
async def ticketpanel(ctx):

    embed = discord.Embed(
        title="ZYROX SUPPORT",
        description=(
            "Need help?\n\n"
            "Click the button below to create a ticket.\n"
            "Our support team is ready to help you.\n\n"
            "🔹 General Support\n"
            "🔹 Purchase Support\n"
            "🔹 Account Support"
        ),
        color=discord.Color.red()
    )

    embed.set_footer(text="ZYROX • GAMING • SUPPORT • MORE")

    # Attach the ZYROX image to the panel
    image = discord.File("zyrox.png", filename="zyrox.png")
    embed.set_image(url="attachment://zyrox.png")

    await ctx.send(
        embed=embed,
        file=image,
        view=TicketPanel()
    )


@bot.event
async def on_ready():
    bot.add_view(TicketPanel())
    bot.add_view(CloseTicket())
    print(f"ZYROX is online: {bot.user}")
