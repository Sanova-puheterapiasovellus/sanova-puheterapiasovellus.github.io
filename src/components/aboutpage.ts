import type { Store } from "../common/reactive.ts";
import "./styles/aboutpage.css";

function AboutPage(): HTMLElement {
    const page = document.createElement("div");
    page.className = "page";

    page.innerHTML = `
        <div class="card">
            <h1>Tietoa Sanovasta</h1>
            <p>Tämä sovellus on tarkoitettu henkilöille, joilla on afasia ja/tai nimeämisen vaikeuksia. Afasia on puheen ymmärtämisen ja/tai tuottamisen häiriö, joka johtuu useimmiten aivovauriosta.</p>
            <br></br>
            <p>Sanova-sovellus perustuu SFA (Semantic Feature Analysis) ja PCT (Phonological Cueing Therapy) –menetelmiin. SFA on nimeämisharjoittelumenetelmä, jonka ideana on parantaa kykyä nimetä sanoja semanttisia, eli sanan merkityksiin liittyviä piirteitä, harjoittelemalla. PCT puolestaan on menetelmä, joka keskittyy nimeämisen harjoitteluun äänteellisten tai ortografisten eli sanojen kirjainasuun liittyvien vihjeiden avulla.</p>
            <br></br>
            <p>Sovellus parantaa sananlöytämistä, tukee itsenäistä harjoittelua ja mahdollistaa harjoittelun paineettomasti omassa rauhassa. Sovellusta on helppo käyttää ja se sisältää arkipäiväisiä, hyödyllisiä sanoja.</p>
            <br></br>
            <p>(Duodecim Terveyskirjasto, 2023; Evans ym., 2021; Fridriksson ym., 2018; Greenwood ym., 2010; Hashimoto, 2023; Quique ym., 2019; Roelofs, 2021)</p>
    `;
    return page;
}

export function initializeAboutPage(hash: Store<string>) {
    const container = document.getElementById("aboutpage-container");
    const main = document.querySelector("main.mainview-main") as HTMLElement;
    if (!container || !main) return;

    hash.subscribe((value) => {
        if (value === "#about") {
            main.style.display = "none"; // hide main
            container.style.display = "block";
            container.innerHTML = "";
            container.appendChild(AboutPage());
        } else {
            // hide this AboutPage page
            container.style.display = "none";
            container.innerHTML = "";
            // show main
            main.style.display = "block";
        }
    });
}

/*<br></br>
            <p>Evans, W. S., Cavanaugh, R., Gravier, M. L., Autenreith, A. M., Doyle, P. J., Hula, W. D., & Dickey, M. W. (2021). Effects of Semantic Feature Type, Diversity, and Quantity on Semantic Feature Analysis Treatment Outcomes in Aphasia. American Journal of Speech-Language Pathology, 30(1S), 344–358. https://doi.org/10.1044/2020_AJSLP-19-00112</p>
            <br></br>
            <p>Fridriksson, J., den Ouden, D.-B., Hillis, A. E., Hickok, G., Rorden, C., Basilakos, A., Yourganov, G., & Bonilha, L. (2018). Anatomy of aphasia revisited. Brain (London, England : 1878), 141(3), 848–862. https://doi.org/10.1093/brain/awx363</p>
            <br></br>
            <p>Greenwood, A., Grassly, J., Hickin, J., & Best, W. (2010). Phonological and orthographic cueing therapy: A case of generalised improvement. Aphasiology, 24(9), Article 924635765. https://doi.org/10.1080/02687030903168220</p>
            <br></br>
            <p>Hashimoto, N. (2023). Using a combined working memory – Semantic feature analysis approach to treat anomia in aphasia: A Pilot Study. Journal of Communication Disorders, 106, Article 106384. https://doi.org/10.1016/j.jcomdis.2023.106384</p>
            <br></br>
            <p>Quique, Y. M., Evans, W. S., & Dickey, M. W. (2019). Acquisition and Generalization Responses in Aphasia Naming Treatment: A Meta-Analysis of Semantic Feature Analysis Outcomes. American Journal of Speech-Language Pathology, 28(1S), 230–246. https://doi.org/10.1044/2018_AJSLP-17-0155</p>
            <br></br>
            <p>Roelofs, A. (2021). Phonological cueing of word finding in aphasia: insights from simulations of immediate and treatment effects. Aphasiology, 35(2), 169–185. https://doi.org/10.1080/02687038.2019.1686748</p>
        </div>*/
