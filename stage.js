var channel = new BroadcastChannel("obs_openlp_channel");
channel.onmessage = (evt) => {
    $("#lyrics").text(evt.data);
};