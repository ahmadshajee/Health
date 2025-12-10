import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  PersonAdd as PersonAddIcon,
  WbSunny as MorningIcon,
  LightMode as AfternoonIcon,
  WbTwilight as EveningIcon,
  NightsStay as NightIcon
} from '@mui/icons-material';
import { usersAPI, prescriptionsAPI } from '../../services/api';
import axios from 'axios';

// Debounce function to limit API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Common Indian medicine brands database
const indianMedicines = [
  // Pain & Fever
  'Dolo 650', 'Dolo 500', 'Dolo 250', 'Crocin 650', 'Crocin 500', 'Crocin Advance',
  'Calpol 500', 'Calpol 650', 'Calpol Suspension', 'Combiflam', 'Combiflam Plus',
  'Ibugesic Plus', 'Ibugesic 400', 'Brufen 400', 'Brufen 600', 'Brufen Suspension',
  'Disprin', 'Saridon', 'Dart', 'Sumo', 'Sumo L', 'Zerodol P', 'Zerodol SP',
  'Zerodol TH', 'Zerodol MR', 'Hifenac P', 'Hifenac TH', 'Hifenac MR',
  'Nicip Plus', 'Nicip', 'Nimesulide 100', 'Voveran', 'Voveran SR', 'Voveran D',
  'Voveran Emulgel', 'Flexon', 'Flexon MR', 'Meftal Spas', 'Meftal Forte', 'Meftal P',
  'Diclogesic', 'Diclofenac 50', 'Diclofenac Gel', 'Piroxicam 20', 'Dolokind Plus',
  'Aceclofenac 100', 'Hifenac', 'Movon', 'Movon P', 'Naprosyn 500', 'Naxdom 500',
  'Ketorol DT', 'Ketorol 10', 'Toradol', 'Ultracet', 'Tramadol 50', 'Tramadol 100',
  
  // Antibiotics
  'Augmentin 625', 'Augmentin 1g', 'Augmentin DDS', 'Clavam 625', 'Clavam 1000',
  'Amoxyclav 625', 'Amoxyclav 375', 'Moxikind CV 625', 'Moxikind CV 1000',
  'Azithral 500', 'Azithral 250', 'Azee 500', 'Azee 250', 'Zithromax', 'Azicip 500',
  'Cifran 500', 'Cifran 250', 'Cifran OD', 'Ciplox 500', 'Ciplox 250', 'Ciplox TZ',
  'Monocef', 'Monocef O', 'Monocef O 200', 'Taxim O', 'Taxim O 200', 'Taxim Injection',
  'Cefixime 200', 'Cefixime 100', 'Zifi 200', 'Zifi CV', 'Mahacef 200', 'Mahacef Plus',
  'Oflox 200', 'Oflox 400', 'Oflox OZ', 'Oflox TZ', 'Zenflox 200', 'Zenflox OZ',
  'Levoflox 500', 'Levoflox 750', 'Levoflox 250', 'Levomac 500', 'Glevo 500',
  'Metrogyl 400', 'Metrogyl 200', 'Flagyl 400', 'Flagyl 200', 'Metronidazole 400',
  'Norflox 400', 'Norflox TZ', 'Norbactin 400', 'Doxycycline 100', 'Doxt SL',
  'Amoxicillin 500', 'Amoxicillin 250', 'Novamox 500', 'Mox 500', 'Mox 250',
  'Ampicillin 500', 'Ampicillin 250', 'Erythromycin 500', 'Erythromycin 250',
  'Clarithromycin 500', 'Claribid 500', 'Clindamycin 300', 'Dalacin C 300',
  'Linezolid 600', 'Lizolid 600', 'Gentamicin Injection', 'Amikacin Injection',
  'Ceftriaxone 1g', 'Monocef Injection', 'Cefoperazone', 'Magnex Injection',
  'Meropenem 1g', 'Meronem', 'Piperacillin Tazobactam', 'Tazact', 'Tazo',
  'Vancomycin 500mg', 'Vancocin', 'Teicoplanin', 'Targocid', 'Colistin',
  
  // Gastro/Acidity
  'Pan 40', 'Pan D', 'Pan DSR', 'Pantop 40', 'Pantop D', 'Pantop DSR',
  'Omez 20', 'Omez D', 'Omez IT', 'Omez DSR', 'Omeprazole 20', 'Ocid 20',
  'Razo 20', 'Razo D', 'Razo DSR', 'Rabeprazole 20', 'Rabeloc 20',
  'Aciloc 150', 'Aciloc 300', 'Rantac 150', 'Rantac 300', 'Zinetac', 'Ranitidine 150',
  'Gelusil MPS', 'Gelusil Syrup', 'Digene', 'Digene Gel', 'Digene Fizz',
  'Mucaine Gel', 'Mucaine Syrup', 'Pudin Hara', 'Hajmola', 'Eno', 'Eno Lemon',
  'Gaviscon', 'Gaviscon Advance', 'Pantocid', 'Pantocid DSR', 'Pantocid L',
  'Nexpro 40', 'Nexpro RD', 'Nexpro L', 'Esomeprazole 40', 'Nexium 40',
  'Sucralfate', 'Sucrafil O', 'Mucosta', 'Rebagen', 'Rebamipide',
  'Veloz 20', 'Veloz D', 'Sompraz 40', 'Sompraz D', 'Raciper 20',
  'Famotidine 20', 'Famocid 20', 'Lansoprazole 30', 'Lanzol 30', 'Lanspep',
  
  // Cough & Cold
  'Benadryl', 'Benadryl DR', 'Corex', 'Corex DX', 'Honitus', 'Honitus Syrup',
  'Ascoril LS', 'Ascoril D', 'Ascoril Plus', 'Ascoril Expectorant', 'Grilinctus',
  'Alex', 'Alex Syrup', 'Chericof', 'Chericof LS', 'Koflet', 'Koflet SF',
  'Vicks Action 500', 'Vicks Vaporub', 'Vicks Inhaler', 'Sinarest', 'Sinarest LP',
  'Sinarest AF', 'Nasivion', 'Nasivion Nasal Drops', 'Otrivin', 'Otrivin Nasal Spray',
  'Allegra 120', 'Allegra 180', 'Allegra M', 'Cetrizine 10', 'Cetirizine 5',
  'Montair LC', 'Montair FX', 'Montair 10', 'Montair 4', 'Montek LC',
  'Levocet', 'Levocet M', 'Okacet', 'Okacet Plus', 'Zyrtec', 'Zyrtec D',
  'Mucinac 600', 'Mucinac 200', 'Mucomix', 'Ambrodil S', 'Ambrodil Plus',
  'Phensedyl', 'Tixylix', 'Cofsils', 'Strepsils', 'Vicks Cough Drops',
  'Tusq DX', 'Zedex', 'Dristan', 'Coldact', 'Cheston Cold', 'Cetzine',
  'Levocetirizine 5', 'Xyzal', 'Fexofenadine 120', 'Fexofenadine 180',
  'Asthalin Inhaler', 'Asthalin Syrup', 'Asthalin Respules', 'Budecort Inhaler',
  'Duolin Inhaler', 'Duolin Respules', 'Foracort Inhaler', 'Seroflo Inhaler',
  'Deriphyllin', 'Deriphyllin Retard', 'Theophylline 300', 'Ventorlin',
  
  // Diabetes
  'Metformin 500', 'Metformin 850', 'Metformin 1000', 'Glycomet 500', 'Glycomet 850',
  'Glycomet 1000', 'Glycomet GP1', 'Glycomet GP2', 'Glycomet GP3', 'Glycomet SR 500',
  'Glucophage 500', 'Glucophage 850', 'Glucophage XR', 'Janumet 50/500', 'Janumet 50/1000',
  'Januvia 50', 'Januvia 100', 'Jalra 50', 'Jalra 100', 'Jalra M 50/500',
  'Galvus 50', 'Galvus Met 50/500', 'Galvus Met 50/1000', 'Trajenta 5', 'Trajenta Duo',
  'Amaryl 1mg', 'Amaryl 2mg', 'Amaryl 3mg', 'Amaryl 4mg', 'Amaryl M1', 'Amaryl M2',
  'Glimepiride 1mg', 'Glimepiride 2mg', 'Glimepiride 4mg', 'Glimisave 1', 'Glimisave 2',
  'Gliclazide 40', 'Gliclazide 80', 'Glizid 40', 'Glizid 80', 'Glycinorm 80',
  'Glibenclamide 5', 'Daonil 5', 'Euglucon', 'Glyburide', 'Glurenorm',
  'Pioglitazone 15', 'Pioglitazone 30', 'Pioz 15', 'Pioz 30', 'Actos 15',
  'Voglibose 0.2', 'Voglibose 0.3', 'Volix 0.2', 'Volix 0.3', 'Vobose',
  'Teneligliptin 20', 'Ziten 20', 'Tenepla 20', 'Tendia 20',
  'Empagliflozin 10', 'Empagliflozin 25', 'Jardiance 10', 'Jardiance 25',
  'Dapagliflozin 5', 'Dapagliflozin 10', 'Forxiga 10', 'Oxra 10',
  'Insulin Mixtard', 'Insulin Actrapid', 'Insulin Lantus', 'Insulin Novorapid',
  'Insulin Human Mixtard', 'Insulin Glargine', 'Insulin Lispro', 'Humalog',
  
  // Blood Pressure
  'Amlodipine 5', 'Amlodipine 10', 'Amlodipine 2.5', 'Amlong 5', 'Amlong 10',
  'Amlong A', 'Amlong AT', 'Stamlo 5', 'Stamlo 10', 'Stamlo Beta',
  'Telmisartan 40', 'Telmisartan 80', 'Telmisartan 20', 'Telma 40', 'Telma 80',
  'Telma H', 'Telma AM', 'Telmikind 40', 'Telmikind H', 'Eritel 40',
  'Losartan 50', 'Losartan 25', 'Losartan 100', 'Losacar 50', 'Losacar H',
  'Repace 50', 'Repace H', 'Covance 50', 'Losar 50', 'Losanorm 50',
  'Aten 50', 'Aten 25', 'Aten 100', 'Atenolol 50', 'Atenolol 25', 'Betacard 50',
  'Metoprolol 25', 'Metoprolol 50', 'Metoprolol 100', 'Met XL 25', 'Met XL 50',
  'Metolar XR 25', 'Metolar XR 50', 'Betaloc 50', 'Seloken XL',
  'Concor 5', 'Concor 2.5', 'Concor 10', 'Bisoprolol 5', 'Bisoprolol 2.5',
  'Cilacar 10', 'Cilacar 5', 'Cilacar 20', 'Cilnidipine 10', 'Cilnidipine 5',
  'Olmesar 20', 'Olmesar 40', 'Olmesar H', 'Olmax 20', 'Olmax H', 'Olmezest 20',
  'Ramipril 5', 'Ramipril 2.5', 'Ramipril 10', 'Cardace 5', 'Cardace 2.5',
  'Enalapril 5', 'Enalapril 10', 'Envas 5', 'Envas 10', 'Enam 5',
  'Lisinopril 5', 'Lisinopril 10', 'Listril 5', 'Listril 10',
  'Prazosin 5', 'Prazosin XL', 'Minipress XL', 'Prazocip 5',
  'Nebivolol 5', 'Nebistar 5', 'Nebicard 5', 'Nebicip 5',
  'Carvedilol 6.25', 'Carvedilol 12.5', 'Carvedilol 25', 'Carca 6.25',
  'Furosemide 40', 'Lasix 40', 'Lasix 20', 'Frusamide 40',
  'Torsemide 10', 'Torsemide 20', 'Dytor 10', 'Dytor 20',
  'Spironolactone 25', 'Spironolactone 50', 'Aldactone 25', 'Aldactone 50',
  'Chlorthalidone 12.5', 'Chlorthalidone 25', 'Thalitone', 'Clopress',
  'Hydrochlorothiazide 12.5', 'Hydrochlorothiazide 25', 'Aquazide',
  
  // Vitamins & Supplements
  'Becosules', 'Becosules Z', 'Becosule Capsules', 'Supradyn', 'Supradyn Daily',
  'Revital', 'Revital H', 'Revital Woman', 'Zincovit', 'Zincovit Syrup',
  'Limcee 500', 'Limcee 1000', 'Celin 500', 'Celin 1000', 'Vitamin C 500',
  'Shelcal 500', 'Shelcal HD', 'Shelcal OS', 'Calcimax 500', 'Calcimax P',
  'Calcitas', 'CCM', 'Calcium Sandoz', 'Cipcal 500', 'Cipcal HD',
  'Uprise D3', 'Uprise D3 60K', 'D Rise', 'D Rise 60K', 'Vitamin D3 60K',
  'Vitamin D3 1000', 'Calcirol 60K', 'Calcirol Sachet', 'Arachitol 6L',
  'Evion 400', 'Evion 600', 'Evion 200', 'Vitamin E 400', 'E-Cod',
  'Neurobion Forte', 'Neurobion Injection', 'Nervijen Plus', 'Nurokind Plus',
  'Methylcobalamin 1500', 'Methylcobalamin 500', 'Mecobalamin', 'Mecovon',
  'Folic Acid 5mg', 'Folic Acid 1mg', 'Folvite 5mg', 'Folvite 1mg',
  'Livogen', 'Livogen XT', 'Autrin', 'Autrin XT', 'Ferium XT', 'Ferium GT',
  'Orofer XT', 'Orofer S', 'Ferrous Sulfate', 'Fefol', 'Fefol Z',
  'A to Z NS', 'A to Z Gold', 'Multibionta', 'Cobadex Forte', 'Cobadex CZS',
  'Polybion', 'Polybion SF', 'B Complex Forte', 'Beplex Forte', 'Benadon 40',
  'Pyridoxine 40', 'Vitamin B6', 'Thiamine 100', 'Vitamin B1',
  'Riboflavin', 'Vitamin B2', 'Niacin', 'Nicotinamide', 'Biotin',
  'Omega 3', 'Fish Oil', 'Salmon Omega', 'Seven Seas', 'Maxepa',
  'Coenzyme Q10', 'CoQ10', 'Ubiquinone', 'Quten 100',
  'Glucosamine', 'Glucosamine Chondroitin', 'Jointace', 'Artho G Plus',
  'Chondroitin', 'MSM', 'Flexura D', 'Cartigen',
  'Ensure', 'Ensure Diabetes Care', 'Protinex', 'Horlicks', 'Bournvita',
  
  // Anti-allergics
  'Avil 25', 'Avil 50', 'Avil Injection', 'Pheniramine', 'Piriton',
  'Atarax 10', 'Atarax 25', 'Hydroxyzine 10', 'Hydroxyzine 25',
  'Montelukast 10', 'Montelukast 5', 'Montelukast 4', 'Montec LC', 'Montec',
  'Levocetirizine 5', 'Fexofenadine 120', 'Fexofenadine 60', 'Bilastine 20',
  'Desloratadine 5', 'Deslor 5', 'Aerius', 'Loratadine 10', 'Lorfast 10',
  'Ebastine 10', 'Ebast 10', 'Ebastel', 'Rupatadine 10', 'Rupahist',
  'Ketotifen 1', 'Ketasma 1', 'Zaditen', 'Cromoglycate', 'Cromolyn',
  
  // Steroids
  'Wysolone 5', 'Wysolone 10', 'Wysolone 20', 'Wysolone 40', 'Wysolone 60',
  'Omnacortil 5', 'Omnacortil 10', 'Omnacortil 20', 'Omnacortil 40',
  'Prednisolone 5', 'Prednisolone 10', 'Prednisolone 20', 'Hostacortin',
  'Deflazacort 6', 'Deflazacort 12', 'Defcort 6', 'Defcort 12', 'Calcort 6',
  'Betnesol', 'Betnesol Injection', 'Betamethasone', 'Betacap TR',
  'Dexamethasone 0.5', 'Dexamethasone 4', 'Dexona', 'Decdan', 'Decadron',
  'Methylprednisolone 4', 'Methylprednisolone 8', 'Medrol 4', 'Medrol 8',
  'Hydrocortisone', 'Cortisol', 'Efcorlin', 'Solu-Cortef',
  'Budesonide', 'Budez CR', 'Entocort', 'Pulmicort',
  'Triamcinolone', 'Kenacort', 'Tricort',
  
  // Cardiac
  'Ecosprin 75', 'Ecosprin 150', 'Ecosprin 325', 'Ecosprin AV 75', 'Ecosprin AV 150',
  'Ecosprin Gold', 'Aspirin 75', 'Aspirin 150', 'Disprin CV',
  'Clopidogrel 75', 'Clopidogrel 150', 'Clopilet 75', 'Clopilet A 75',
  'Deplatt 75', 'Deplatt 150', 'Deplatt A 75', 'Deplatt A 150', 'Deplatt CV',
  'Prasugrel 10', 'Prasugrel 5', 'Prazrel 10', 'Effient 10',
  'Ticagrelor 90', 'Brilinta 90', 'Axcer 90', 'Agrela 90',
  'Rozavel 10', 'Rozavel 20', 'Rozavel 5', 'Rozavel F', 'Rozavel EZ',
  'Atorvastatin 10', 'Atorvastatin 20', 'Atorvastatin 40', 'Atorvastatin 80',
  'Atorva 10', 'Atorva 20', 'Atorva 40', 'Tonact 10', 'Tonact 20',
  'Storvas 10', 'Storvas 20', 'Storvas 40', 'Lipitor 10', 'Lipitor 20',
  'Rosuvastatin 10', 'Rosuvastatin 20', 'Rosuvastatin 5', 'Rosuvas 10',
  'Simvastatin 10', 'Simvastatin 20', 'Simvastatin 40', 'Zocor 10',
  'Fenofibrate 160', 'Fenofibrate 145', 'Lipicard 160', 'Lipikind 160',
  'Atorvastatin Fenofibrate', 'Atorfit CV', 'Tonact TG',
  'Nitroglycerine', 'Sorbitrate 5', 'Sorbitrate 10', 'Isordil 5', 'Isordil 10',
  'Nitroglycerin Patch', 'Nitrodermal', 'GTN Spray', 'Nitrolingual Spray',
  'Isosorbide Mononitrate', 'Ismo 20', 'Imdur 30', 'Monotrate 20',
  'Diltiazem 30', 'Diltiazem 60', 'Dilzem 30', 'Dilzem 60', 'Angizem CD',
  'Verapamil 40', 'Verapamil 80', 'Calaptin 40', 'Calaptin 80',
  'Digoxin 0.25', 'Lanoxin', 'Digitalis', 'Cardioxin',
  'Amiodarone 100', 'Amiodarone 200', 'Cordarone', 'Duron',
  'Ivabradine 5', 'Ivabradine 7.5', 'Coralan 5', 'Ivanorm 5',
  'Ranolazine 500', 'Ranolazine 1000', 'Ranexa 500', 'Ranozex 500',
  'Trimetazidine 35', 'Vastarel MR', 'Flavedon MR', 'Trivedon',
  
  // Thyroid
  'Thyronorm 25', 'Thyronorm 50', 'Thyronorm 75', 'Thyronorm 100', 'Thyronorm 125',
  'Thyronorm 150', 'Eltroxin 25', 'Eltroxin 50', 'Eltroxin 100', 'Eltroxin 125',
  'Thyrox 25', 'Thyrox 50', 'Thyrox 75', 'Thyrox 100', 'Thyrox 125',
  'Levothyroxine 25', 'Levothyroxine 50', 'Levothyroxine 100', 'Lethyrox',
  'Synthroid', 'Euthyrox', 'Tirosint', 'Levoxyl',
  'Neomercazole 5', 'Neomercazole 10', 'Carbimazole 5', 'Carbimazole 10',
  'Thyrozol 5', 'Thyrozol 10', 'Methimazole 5', 'Tapazole',
  'Propylthiouracil 50', 'PTU 50',
  
  // Antidepressants & Psychiatric
  'Escitalopram 10', 'Escitalopram 5', 'Escitalopram 20', 'Nexito 10', 'Nexito 5',
  'Cipralex 10', 'Stalopam 10', 'Rexipra 10', 'S Citadep 10',
  'Sertraline 50', 'Sertraline 100', 'Serlift 50', 'Zoloft 50', 'Daxid 50',
  'Fluoxetine 20', 'Fluoxetine 40', 'Fludac 20', 'Prozac 20', 'Flunil 20',
  'Paroxetine 12.5', 'Paroxetine 25', 'Paxil CR', 'Parotin 12.5',
  'Venlafaxine 37.5', 'Venlafaxine 75', 'Venlor XR', 'Effexor XR', 'Veniz XR',
  'Duloxetine 20', 'Duloxetine 30', 'Duloxetine 60', 'Cymbalta 30', 'Duzela 20',
  'Mirtazapine 7.5', 'Mirtazapine 15', 'Mirtaz 7.5', 'Mirtaz 15',
  'Bupropion 150', 'Bupropion 300', 'Wellbutrin', 'Aplenzin',
  'Trazodone 50', 'Trazodone 100', 'Trazonil 50',
  'Amitriptyline 10', 'Amitriptyline 25', 'Tryptomer 10', 'Tryptomer 25',
  'Nortriptyline 25', 'Nortriptyline 10', 'Sensival 25',
  'Clomipramine 25', 'Clomipramine 75', 'Clonil 25',
  'Alprazolam 0.25', 'Alprazolam 0.5', 'Alprazolam 1', 'Alprax 0.25', 'Alprax 0.5',
  'Clonazepam 0.25', 'Clonazepam 0.5', 'Clonotril 0.5', 'Rivotril 0.5',
  'Lorazepam 1', 'Lorazepam 2', 'Ativan 1', 'Ativan 2', 'Lopez 1',
  'Diazepam 5', 'Diazepam 10', 'Valium 5', 'Calmpose 5',
  'Oxazepam 10', 'Oxazepam 15', 'Serepax',
  'Olanzapine 5', 'Olanzapine 10', 'Oleanz 5', 'Olanex 5', 'Zyprexa 5',
  'Risperidone 1', 'Risperidone 2', 'Risperdal 1', 'Sizodon 1', 'Risdone 2',
  'Quetiapine 25', 'Quetiapine 50', 'Quetiapine 100', 'Seroquel 25', 'Qutan 25',
  'Aripiprazole 5', 'Aripiprazole 10', 'Abilify 5', 'Aripra 5',
  'Haloperidol 5', 'Haloperidol 10', 'Serenace 5', 'Haldol 5',
  'Lithium 300', 'Lithium 450', 'Licab 300', 'Lithosun 300',
  'Valproate 200', 'Valproate 500', 'Valparin 200', 'Valparin 500', 'Depakote',
  'Carbamazepine 200', 'Carbamazepine 400', 'Tegretol 200', 'Zen Retard 200',
  'Lamotrigine 25', 'Lamotrigine 50', 'Lamictal 25', 'Lamitor 25',
  'Modafinil 100', 'Modafinil 200', 'Modalert 100', 'Modalert 200',
  
  // Sleep & Sedatives
  'Zolpidem 5', 'Zolpidem 10', 'Zolfresh 5', 'Zolfresh 10', 'Ambien',
  'Zopiclone 7.5', 'Zopicon 7.5', 'Imovane', 'Zop 7.5',
  'Eszopiclone 1', 'Eszopiclone 2', 'Lunesta', 'Ezesta 2',
  'Melatonin 3', 'Melatonin 5', 'Meloset 3',
  
  // Muscle Relaxants
  'Thiocolchicoside 4', 'Thiocolchicoside 8', 'Myoril 4', 'Myoril 8',
  'Eperisone 50', 'Epry 50', 'Myospaz', 'Myonit',
  'Chlorzoxazone 250', 'Chlorzoxazone 500', 'Flexon', 'Myoflex',
  'Baclofen 10', 'Baclofen 25', 'Lioresal 10', 'Liofen 10',
  'Tizanidine 2', 'Tizanidine 4', 'Sirdalud 2', 'Tizan 2',
  'Carisoprodol 350', 'Soma 350',
  'Cyclobenzaprine 10', 'Flexeril 10',
  
  // Anti-infective/Antifungal/Antiviral
  'Fluconazole 150', 'Fluconazole 200', 'Forcan 150', 'Zocon 150',
  'Itraconazole 100', 'Itraconazole 200', 'Canditral 100', 'Sporanox',
  'Ketoconazole 200', 'Nizral 200', 'Ketomac',
  'Terbinafine 250', 'Terbicip 250', 'Lamisil 250',
  'Griseofulvin 250', 'Griseofulvin 500', 'Grisovin FP',
  'Clotrimazole', 'Candid', 'Canesten', 'Clotrin',
  'Miconazole', 'Daktarin', 'Micogel',
  'Acyclovir 200', 'Acyclovir 400', 'Acyclovir 800', 'Zovirax 200', 'Acivir 400',
  'Valacyclovir 500', 'Valacyclovir 1000', 'Valcivir 500', 'Valtrex 500',
  'Famciclovir 250', 'Famciclovir 500', 'Famtrex 250',
  'Oseltamivir 75', 'Tamiflu 75', 'Antiflu 75', 'Fluvir 75',
  'Albendazole 400', 'Zentel 400', 'Albendazole Suspension', 'Noworm',
  'Mebendazole 100', 'Mebex 100', 'Vermox',
  'Ivermectin 12', 'Ivermectin 6', 'Ivecop 12', 'Ivermectol 12',
  'Nitazoxanide 500', 'Nitazoxanide 200', 'Nizonide 500', 'Nitax 500',
  'Secnidazole 1000', 'Secnil 1g', 'Secnidazole DT',
  'Ornidazole 500', 'Ornidazole 250', 'Ornof 500', 'O2 500',
  'Tinidazole 500', 'Tinidazole 300', 'Fasigyn 500',
  
  // GI Medicines  
  'Domperidone 10', 'Domstal 10', 'Motilium 10', 'Vomistop 10',
  'Ondansetron 4', 'Ondansetron 8', 'Emeset 4', 'Emeset 8', 'Ondem 4', 'Ondem 8',
  'Metoclopramide 10', 'Perinorm 10', 'Maxolon 10', 'Reglan 10',
  'Prochlorperazine 5', 'Stemetil 5', 'Compazine 5',
  'Promethazine 25', 'Phenergan 25', 'Avomine 25',
  'Cyclizine 50', 'Marzine 50',
  'Meclizine 25', 'Vertin 8', 'Vertin 16', 'Stugeron 25', 'Stugeron Forte',
  'Betahistine 8', 'Betahistine 16', 'Serc 8', 'Serc 16', 'Vertin',
  'Loperamide 2', 'Imodium 2', 'Eldoper 2', 'Lopamide 2',
  'Racecadotril 100', 'Redotil 100', 'Zedott 100',
  'ORS', 'Electral', 'Enerzal', 'Glucon D',
  'Bisacodyl 5', 'Dulcolax 5', 'Laxative',
  'Isabgol', 'Sat Isabgol', 'Fybogel', 'Naturolax',
  'Lactulose', 'Duphalac', 'Laxido', 'Cremaffin',
  'Senna', 'Senokot', 'Sofsena',
  'Polyethylene Glycol', 'Pegred', 'Laxopeg', 'Softovac',
  'Sodium Picosulfate', 'Picosulf', 'Gutclear',
  'Ursodeoxycholic Acid 150', 'Ursodeoxycholic Acid 300', 'Udiliv 150', 'Udiliv 300',
  'Liv 52', 'Liv 52 DS', 'Livolin Forte', 'Hepamerz',
  
  // Eye/Ear Drops
  'Moxifloxacin Eye Drops', 'Moxigram', 'Vigamox', 'Moxicip',
  'Ciprofloxacin Eye Drops', 'Ciplox Eye Drops', 'Ciprodex',
  'Ofloxacin Eye Drops', 'Oflox Eye Drops', 'Ocuflox',
  'Tobramycin Eye Drops', 'Tobrex', 'Tobrasol',
  'Gentamicin Eye Drops', 'Gentamicin Ear Drops', 'Genticyn',
  'Chloramphenicol Eye Drops', 'Chlorocol', 'Ocupol D',
  'Dexamethasone Eye Drops', 'Dexacort Eye Drops',
  'Prednisolone Eye Drops', 'Pred Forte',
  'Timolol Eye Drops', 'Timolol 0.5%', 'Iotim', 'Glucomol',
  'Latanoprost Eye Drops', 'Xalatan', 'Latoprost', 'Latim',
  'Brimonidine Eye Drops', 'Alphagan', 'Brimodin P',
  'Dorzolamide Eye Drops', 'Trusopt', 'Dorzox',
  'Pilocarpine Eye Drops', 'Pilocar',
  'Tropicamide Eye Drops', 'Tropicacyl', 'Mydril',
  'Cyclopentolate Eye Drops', 'Cyclogyl', 'Cyclomid',
  'Atropine Eye Drops', 'Atropine Sulphate',
  'Phenylephrine Eye Drops', 'Drosyn', 'Phenyl',
  'Artificial Tears', 'Refresh Tears', 'Tears Naturale', 'Systane',
  'Carboxymethylcellulose', 'CMC Drops', 'Optive', 'Lubrex',
  'Sodium Hyaluronate Eye Drops', 'Hycosan', 'Hylo Tears',
  
  // Topical/Skin
  'Betadine', 'Betadine Ointment', 'Betadine Solution', 'Povidone Iodine',
  'Soframycin', 'Soframycin Cream', 'Framycetin', 'Sofradex',
  'Neosporin', 'Neosporin Powder', 'Neosporin H',
  'T-Bact', 'T-Bact Ointment', 'Mupirocin', 'Mupiderm',
  'Fucidin', 'Fucidin Cream', 'Fusidic Acid', 'Fucibet',
  'Silver Sulfadiazine', 'Silverex', 'SSD Cream', 'Burnheal',
  'Clobetasol', 'Tenovate', 'Clobevate', 'Dermovate',
  'Lobate', 'Lobate GM', 'Lobate S',
  'Halovate', 'Halovate S', 'Halox S',
  'Momate', 'Momate Cream', 'Elocon', 'Mometasone',
  'Betamethasone Cream', 'Betnovate', 'Betnovate C', 'Betnovate N',
  'Panderm Plus', 'Quadriderm', 'Quadriderm RF', 'Candid B',
  'Dermadew', 'Dermadew Lotion', 'Moisturex', 'Lacsoft',
  'Calamine Lotion', 'Lacto Calamine', 'Calak Lotion',
  'Cetaphil', 'Cetaphil Lotion', 'Cetaphil Cream',
  'Clotrimazole Cream', 'Candid Cream', 'Canesten Cream',
  'Ketoconazole Cream', 'Nizral Cream', 'Ketomac Cream',
  'Terbinafine Cream', 'Terbicip Cream', 'Lamisil Cream',
  'Acne Cream', 'Benzac', 'Benzoyl Peroxide Gel', 'Persol AC',
  'Adapalene Gel', 'Differin', 'Deriva',
  'Tretinoin Cream', 'Retino A', 'Renova',
  'Clindamycin Gel', 'Clinac BPO', 'Clearz Plus',
  'Permethrin Cream', 'Permitex', 'Scaboma',
  'Lindane Lotion', 'Lorexane', 'Scabene',
  'Ivermectin Lotion', 'Soolantra',
  'Calcipotriol', 'Daivonex', 'Daivobet',
  'Tacrolimus Ointment', 'Tacroz', 'Protopic',
  'Pimecrolimus Cream', 'Elidel',
  'Minoxidil 5%', 'Minoxidil 2%', 'Rogaine', 'Hair 4U', 'Mintop',
  'Finasteride 1mg', 'Finpecia', 'Propecia', 'Finax',
  
  // Others
  'Pantoprazole 40', 'Rabeprazole 20', 'Esomeprazole 40', 'Ilaprazole 10',
  'Buscopan', 'Buscopan Plus', 'Hyoscine', 'Hyoscine Butylbromide',
  'Drotin DS', 'Drotin M', 'Drotaverine 40', 'Drotaverine 80',
  'Cyclopam', 'Cyclopam Suspension', 'Dicyclomine 10', 'Dicyclomine 20',
  'Norethisterone 5', 'Regestrone', 'Primolut N', 'Deviry',
  'Pause MF', 'Pause 500', 'Tranexa', 'Trenaxa',
  'Tranexamic Acid 500', 'Tranexamic Acid 250', 'Trapic MF',
  'Ethamsylate 250', 'Ethamsylate 500', 'Dicynene', 'Dicynone',
  'Sildenafil 50', 'Sildenafil 100', 'Viagra', 'Penegra', 'Manforce',
  'Tadalafil 10', 'Tadalafil 20', 'Cialis', 'Megalis', 'Tadacip',
  'Tamsulosin 0.4', 'Urimax 0.4', 'Veltam 0.4', 'Contiflo 0.4',
  'Alfuzosin 10', 'Alfoo 10', 'Xatral',
  'Finasteride 5', 'Finast 5', 'Proscar', 'Finpecia 5',
  'Dutasteride 0.5', 'Dutas 0.5', 'Avodart', 'Duprost',
  'Solifenacin 5', 'Solifenacin 10', 'Vesicare', 'Soliten 5',
  'Tolterodine 2', 'Tolterodine 4', 'Detrol', 'Roliten 2',
  'Mirabegron 50', 'Myrbetriq 50', 'Betigra 50',
  'Pregabalin 75', 'Pregabalin 150', 'Pregabalin 300', 'Lyrica 75', 'Pregalin 75',
  'Gabapentin 100', 'Gabapentin 300', 'Gabapin 100', 'Neurontin 300',
  'Nortriptyline Pregabalin', 'Pregalin M',
  'Levetiracetam 500', 'Levetiracetam 750', 'Keppra 500', 'Levipil 500',
  'Phenytoin 100', 'Eptoin 100', 'Dilantin',
  'Topiramate 25', 'Topiramate 50', 'Topamax 25', 'Topamac 25',
  'Oxcarbazepine 150', 'Oxcarbazepine 300', 'Trileptal', 'Oxetol 150',
  'Sodium Valproate 200', 'Sodium Valproate 500', 'Epilim', 'Valparin Chrono'
];

const PrescriptionForm = ({ onCreatePrescription }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  // New patient dialog state
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: ''
  });
  const [newPatientError, setNewPatientError] = useState('');
  
  // Medication autocomplete state
  const [medicationSuggestions, setMedicationSuggestions] = useState({});
  const [loadingMedications, setLoadingMedications] = useState({});
  
  const [prescription, setPrescription] = useState({
    patientId: '',
    patientEmail: '',
    diagnosis: '',
    medications: [
      { name: '', dosage: '', frequency: '', timing: '', durationWeeks: '', durationDays: '' }
    ],
    instructions: '',
    followUpDate: ''
  });

  // Fetch patients when component mounts
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      setError(''); // Clear any previous errors
      console.log('Fetching patients...');
      const response = await usersAPI.getPatients();
      console.log('Patients response:', response);
      console.log('Patients array:', response.patients);
      
      if (response.patients && response.patients.length > 0) {
        setPatientsList(response.patients);
        console.log('Successfully loaded', response.patients.length, 'patients');
      } else {
        console.log('No patients found in response');
        setPatientsList([]);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(`Failed to load patients list: ${error.response?.data?.message || error.message}`);
      setPatientsList([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Search for medication names from local Indian medicines database
  const searchMedications = useCallback((query, index) => {
    if (!query || query.length < 1) {
      setMedicationSuggestions(prev => ({ ...prev, [index]: [] }));
      return;
    }
    
    const searchTerm = query.toLowerCase();
    const matches = indianMedicines.filter(medicine => 
      medicine.toLowerCase().includes(searchTerm)
    ).slice(0, 15); // Limit to 15 suggestions
    
    setMedicationSuggestions(prev => ({ ...prev, [index]: matches }));
  }, []);

  // Handle new patient dialog
  const handleOpenNewPatientDialog = () => {
    setNewPatientDialogOpen(true);
    setNewPatientError('');
    setNewPatientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: ''
    });
  };

  const handleCloseNewPatientDialog = () => {
    setNewPatientDialogOpen(false);
    setNewPatientError('');
  };

  const handleNewPatientChange = (e) => {
    setNewPatientData({
      ...newPatientData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateNewPatient = async () => {
    // Validate required fields
    if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.email) {
      setNewPatientError('First name, last name, and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPatientData.email)) {
      setNewPatientError('Please enter a valid email address');
      return;
    }

    setCreatingPatient(true);
    setNewPatientError('');

    try {
      const response = await usersAPI.createPatient(newPatientData);
      console.log('New patient created:', response);

      // Refresh patients list
      await fetchPatients();

      // Auto-select the new patient
      setPrescription({
        ...prescription,
        patientId: response.patient.id,
        patientEmail: response.patient.email
      });

      // Close dialog and show success
      setNewPatientDialogOpen(false);
      setSuccess(false);
      setError('');
      
      // Show a temporary success message
      alert(`Patient "${response.patient.firstName} ${response.patient.lastName}" created successfully!\n\nDefault password: password123\n\nPlease inform the patient to change their password after first login.`);
    } catch (error) {
      console.error('Failed to create patient:', error);
      setNewPatientError(error.message || 'Failed to create patient');
    } finally {
      setCreatingPatient(false);
    }
  };
  
  const handleChange = (e) => {
    setPrescription({
      ...prescription,
      [e.target.name]: e.target.value
    });
  };
  
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescription.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: '', dosage: '', frequency: '', timing: '', durationWeeks: '', durationDays: '' }
      ]
    });
  };
  
  const removeMedication = (index) => {
    if (prescription.medications.length === 1) {
      return; // Keep at least one medication field
    }
    
    const updatedMedications = prescription.medications.filter((_, i) => i !== index);
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    // Validate form
  if (!(prescription.patientId || prescription.patientEmail) || !prescription.diagnosis || 
        prescription.medications.some(med => !med.name || !med.dosage)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Create prescription via API
      const response = await prescriptionsAPI.createPrescription(prescription);
      
      setLoading(false);
      setSuccess(true);
      
      if (onCreatePrescription) {
        onCreatePrescription(response.prescription);
      }
      
      // Reset form after successful submission
      setPrescription({
        patientId: '',
        patientEmail: '',
        diagnosis: '',
        medications: [
          { name: '', dosage: '', frequency: '', timing: '', durationWeeks: '', durationDays: '' }
        ],
        instructions: '',
        followUpDate: ''
      });
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Failed to create prescription');
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Create New Prescription
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Prescription created successfully! A QR code and email have been sent to the patient.
        </Alert>
      )}
      
      {loadingPatients && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading patients...</Typography>
        </Box>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Autocomplete
                fullWidth
                options={patientsList}
                getOptionLabel={(option) => 
                  option ? `${option.firstName} ${option.lastName} (${option.email})` : ''
                }
                value={patientsList.find(p => p.id === prescription.patientId) || null}
                onChange={(event, newValue) => {
                  setPrescription({
                    ...prescription,
                    patientId: newValue?.id || '',
                    patientEmail: newValue?.email || ''
                  });
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                noOptionsText="No patients found - Create a new patient"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Patient"
                    required
                    placeholder="Type to search patients..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenNewPatientDialog}
                sx={{ minWidth: 160, height: 56 }}
              >
                New Patient
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Diagnosis"
              name="diagnosis"
              multiline
              rows={2}
              value={prescription.diagnosis}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Medications
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {prescription.medications.map((medication, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={medicationSuggestions[index] || []}
                      loading={loadingMedications[index] || false}
                      value={medication.name}
                      onInputChange={(event, newInputValue) => {
                        handleMedicationChange(index, 'name', newInputValue);
                        searchMedications(newInputValue, index);
                      }}
                      onChange={(event, newValue) => {
                        handleMedicationChange(index, 'name', newValue || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          required
                          label="Medication Name"
                          placeholder="Start typing to search..."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingMedications[index] ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Dosage</InputLabel>
                      <Select
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        label="Dosage"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <MenuItem key={num} value={num.toString()}>
                            {num}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        label="Frequency"
                      >
                        <MenuItem value="1">Once a day</MenuItem>
                        <MenuItem value="2">Twice a day</MenuItem>
                        <MenuItem value="3">Three times a day</MenuItem>
                        <MenuItem value="4">Four times a day</MenuItem>
                        <MenuItem value="SOS">As needed (SOS)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Time of Day</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {[
                        { key: 'morning', label: 'Morning', icon: <MorningIcon sx={{ color: '#FFA726' }} /> },
                        { key: 'afternoon', label: 'Afternoon', icon: <AfternoonIcon sx={{ color: '#FFD54F' }} /> },
                        { key: 'evening', label: 'Evening', icon: <EveningIcon sx={{ color: '#FF7043' }} /> },
                        { key: 'night', label: 'Night', icon: <NightIcon sx={{ color: '#5C6BC0' }} /> }
                      ].map((time) => {
                        const timings = medication.timing ? medication.timing.split(', ') : [];
                        const isSelected = timings.includes(time.label);
                        return (
                          <Tooltip key={time.key} title={time.label}>
                            <Box
                              onClick={() => {
                                let newTimings;
                                if (isSelected) {
                                  newTimings = timings.filter(t => t !== time.label);
                                } else {
                                  newTimings = [...timings, time.label];
                                }
                                handleMedicationChange(index, 'timing', newTimings.join(', '));
                              }}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: isSelected ? '2px solid #1976d2' : '2px solid #e0e0e0',
                                backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  backgroundColor: isSelected ? '#bbdefb' : '#f5f5f5',
                                  borderColor: '#1976d2'
                                }
                              }}
                            >
                              {time.icon}
                              <Typography variant="caption" sx={{ mt: 0.5 }}>{time.label}</Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl sx={{ minWidth: 100 }}>
                        <InputLabel>Weeks</InputLabel>
                        <Select
                          value={medication.durationWeeks || ''}
                          onChange={(e) => handleMedicationChange(index, 'durationWeeks', e.target.value)}
                          label="Weeks"
                        >
                          <MenuItem value="">0</MenuItem>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <MenuItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'week' : 'weeks'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 100 }}>
                        <InputLabel>Days</InputLabel>
                        <Select
                          value={medication.durationDays || ''}
                          onChange={(e) => handleMedicationChange(index, 'durationDays', e.target.value)}
                          label="Days"
                        >
                          <MenuItem value="">0</MenuItem>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <MenuItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'day' : 'days'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={1}>
                    <IconButton 
                      color="error" 
                      onClick={() => removeMedication(index)}
                      aria-label="remove medication"
                      disabled={prescription.medications.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addMedication}
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Add Medication
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Instructions"
              name="instructions"
              multiline
              rows={3}
              value={prescription.instructions}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Follow-up Date"
              name="followUpDate"
              type="date"
              value={prescription.followUpDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<QrCodeIcon />}
            disabled={loading || loadingPatients}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Prescription'}
          </Button>
        </Box>
      </Box>

      {/* New Patient Dialog */}
      <Dialog open={newPatientDialogOpen} onClose={handleCloseNewPatientDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            Create New Patient
          </Box>
        </DialogTitle>
        <DialogContent>
          {newPatientError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {newPatientError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Create a new patient account. The patient will be able to login with the email provided and default password: <strong>password123</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={newPatientData.firstName}
                onChange={handleNewPatientChange}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Last Name"
                name="lastName"
                value={newPatientData.lastName}
                onChange={handleNewPatientChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={newPatientData.email}
                onChange={handleNewPatientChange}
                helperText="Patient will use this email to login"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={newPatientData.phone}
                onChange={handleNewPatientChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={newPatientData.dateOfBirth}
                onChange={handleNewPatientChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={newPatientData.gender}
                  onChange={handleNewPatientChange}
                  label="Gender"
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={newPatientData.address}
                onChange={handleNewPatientChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseNewPatientDialog} disabled={creatingPatient}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateNewPatient}
            disabled={creatingPatient}
            startIcon={creatingPatient ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {creatingPatient ? 'Creating...' : 'Create Patient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PrescriptionForm;
